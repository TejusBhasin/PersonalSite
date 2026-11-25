import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { clientIp, isRateLimited, isValidIp, noteAttempt } from '../../shared/guard.ts';

// Tripwire pages: visiting /more blocks the device, /andmore blocks the network it is on.
// Runs with the service role because the visitor is not signed in, so it may only act on
// the caller's own device and the address the server observes for them: a caller can no
// longer block an address it is not coming from, and the write rate is capped.
const DEVICE_ID = /^[A-Za-z0-9_-]{8,64}$/;
const WINDOW_MS = 60 * 60 * 1000;

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const kind = body?.kind === 'network' ? 'network' : body?.kind === 'device' ? 'device' : null;
    if (!kind) return Response.json({ error: 'kind must be device or network' }, { status: 400 });

    const rawDevice = typeof body?.device_id === 'string' ? body.device_id.trim() : '';
    const deviceId = DEVICE_ID.test(rawDevice) ? rawDevice : null;
    const ip = clientIp(req);

    const base44 = createClientFromRequest(req);
    const throttleKey = `trap:${ip}`;
    if (await isRateLimited(base44, throttleKey, { max: 6, windowMs: WINDOW_MS })) {
      return Response.json({ error: 'Too many requests' }, { status: 429 });
    }
    await noteAttempt(base44, throttleKey, { windowMs: WINDOW_MS });

    if (kind === 'device') {
      if (!deviceId) return Response.json({ error: 'device_id is required' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.Banned.filter({ device_id: deviceId });
      if (!existing || existing.length === 0) {
        await base44.asServiceRole.entities.Banned.create({
          device_id: deviceId,
          notes: 'Auto-blocked after visiting /more'
        });
      }
      return Response.json({ ok: true, blocked: 'device' });
    }

    if (!isValidIp(ip)) {
      return Response.json({ error: 'Could not determine network address' }, { status: 400 });
    }
    const existing = await base44.asServiceRole.entities.BlockedNetwork.filter({ ip });
    if (!existing || existing.length === 0) {
      await base44.asServiceRole.entities.BlockedNetwork.create({
        ip,
        label: 'Auto-blocked network',
        notes: `Auto-blocked after visiting /andmore${deviceId ? ` (device ${deviceId})` : ''}`
      });
    }
    return Response.json({ ok: true, blocked: 'network', ip });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}