import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { clientIp, isRateLimited, noteAttempt } from '../../shared/guard.ts';

// Tripwire pages: visiting /more or /andmore blocks the visitor's own device. Runs with the
// service role because the visitor is not signed in, so it may only ever block the caller's
// own device: an anonymous caller can no longer add an address to the network block list,
// which was a way to lock anyone (including the owner) out of the site. Network-wide blocks
// stay an owner action on the Visits page.
const DEVICE_ID = /^[A-Za-z0-9_-]{8,64}$/;
const WINDOW_MS = 60 * 60 * 1000;

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const kind = body?.kind === 'network' ? 'network' : body?.kind === 'device' ? 'device' : null;
    if (!kind) return Response.json({ error: 'kind must be device or network' }, { status: 400 });

    const rawDevice = typeof body?.device_id === 'string' ? body.device_id.trim() : '';
    const deviceId = DEVICE_ID.test(rawDevice) ? rawDevice : null;
    if (!deviceId) return Response.json({ error: 'device_id is required' }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const throttleKey = `trap:${clientIp(req)}`;
    if (await isRateLimited(base44, throttleKey, { max: 6, windowMs: WINDOW_MS, globalMax: 30, scope: 'trap' })) {
      return Response.json({ error: 'Too many requests' }, { status: 429 });
    }
    await noteAttempt(base44, throttleKey, { windowMs: WINDOW_MS, scope: 'trap' });

    const existing = await base44.asServiceRole.entities.Banned.filter({ device_id: deviceId });
    if (!existing || existing.length === 0) {
      await base44.asServiceRole.entities.Banned.create({
        device_id: deviceId,
        notes: kind === 'network' ? 'Auto-blocked after visiting /andmore' : 'Auto-blocked after visiting /more'
      });
    }
    return Response.json({ ok: true, blocked: 'device' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}