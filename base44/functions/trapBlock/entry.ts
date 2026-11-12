import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Tripwire pages: visiting /more blocks the device, /andmore blocks the network it is on.
// Runs with the service role because the visitor is not signed in.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const kind = body?.kind === 'network' ? 'network' : body?.kind === 'device' ? 'device' : null;
    if (!kind) return Response.json({ error: 'kind must be device or network' }, { status: 400 });

    const deviceId = typeof body?.device_id === 'string' && body.device_id.trim() ? body.device_id.trim() : null;
    const reported = typeof body?.client_ip === 'string' && body.client_ip.includes('.') ? body.client_ip.trim() : null;
    const headerIp =
      req.headers.get('cf-connecting-ip') ||
      (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
      null;
    const ip = reported || headerIp;

    const base44 = createClientFromRequest(req);

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

    if (!ip) return Response.json({ error: 'Could not determine network address' }, { status: 400 });
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