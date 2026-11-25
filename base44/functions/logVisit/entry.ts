import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { clientIp, isValidIp } from '../../shared/guard.ts';

const DEVICE_ID = /^[A-Za-z0-9_-]{8,64}$/;
const LOG_WINDOW_MS = 10 * 60 * 1000;
const MAX_LOGS_PER_WINDOW = 60;

export default async function (req) {
  try {
    let path = null;
    let deviceId = null;
    let reportedIp = null;
    try {
      const body = await req.json();
      path = body?.path ?? null;
      deviceId = body?.device_id ?? null;
      reportedIp = body?.client_ip ?? null;
    } catch {
      path = null;
    }

    // Only the address the server observes decides bans. The browser-reported address is
    // kept as a note but never matched against the blocked lists, since anyone can claim any IP.
    const ip = clientIp(req);
    const userAgent = (req.headers.get('user-agent') || '').slice(0, 300);
    const device = typeof deviceId === 'string' && DEVICE_ID.test(deviceId.trim()) ? deviceId.trim() : null;
    const clientIpValue = isValidIp(reportedIp) ? reportedIp.trim() : null;
    const page = typeof path === 'string' && path.startsWith('/') ? path.slice(0, 200) : '/';

    const base44 = createClientFromRequest(req);

    const bans = await base44.asServiceRole.entities.Banned.list(200);
    let banned = bans.some((b) => (b.ip && b.ip === ip) || (device && b.device_id === device));

    // Is this visitor coming from a blocked WiFi network (matched by its public IP)?
    // VIP devices are exempt from whole-network bans (but not from direct device bans).
    if (!banned) {
      const vips = await base44.asServiceRole.entities.VIP.list(200);
      const isVip = device && vips.some((v) => v.device_id === device);
      if (!isVip) {
        const blockedNetworks = await base44.asServiceRole.entities.BlockedNetwork.list(200);
        banned = blockedNetworks.some((n) => n.ip && n.ip === ip);
      }
    }

    // Cap what a single caller can write, so the visit log and device list cannot be flooded.
    const since = new Date(Date.now() - LOG_WINDOW_MS).toISOString();
    const recent = await base44.asServiceRole.entities.VisitLog.count({ ip, created_date: { $gte: since } });
    if ((recent || 0) < MAX_LOGS_PER_WINDOW) {
      await base44.asServiceRole.entities.VisitLog.create({
        ip,
        client_ip: clientIpValue || ip,
        device_id: device || 'unknown',
        path: page,
        user_agent: userAgent
      });

      // Keep a record of every device that has visited the site.
      if (device) {
        const existing = await base44.asServiceRole.entities.Device.filter({ device_id: device });
        if (existing.length > 0) {
          await base44.asServiceRole.entities.Device.update(existing[0].id, {
            ip,
            user_agent: userAgent
          });
        } else {
          await base44.asServiceRole.entities.Device.create({
            device_id: device,
            ip,
            user_agent: userAgent
          });
        }
      }
    }

    return Response.json({ ok: true, banned: Boolean(banned) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}