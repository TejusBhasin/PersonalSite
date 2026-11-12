import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// Constant-time-ish comparison so the access code can't be guessed by timing.
function matches(input, expected) {
  if (typeof input !== 'string' || typeof expected !== 'string') return false;
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body?.code === 'string' ? body.code : '';
    const expected = (secrets.get('VISITS_ACCESS_CODE') || '').trim();
    if (!expected) {
      return Response.json({ error: 'Access code is not configured' }, { status: 500 });
    }
    if (!matches(code.trim(), expected)) {
      return Response.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const action = typeof body?.action === 'string' ? body.action : 'list';

    if (action === 'list') {
      const page = await base44.asServiceRole.entities.VisitLog.list({ sort: '-created_date', limit: 150 });
      const rows = Array.isArray(page) ? page : (page?.items || []);
      const visits = rows.map((v) => ({
          id: v.id,
          created_date: v.created_date,
          ip: v.ip,
          client_ip: v.client_ip,
          device_id: v.device_id,
          path: v.path,
          user_agent: (v.user_agent || '').slice(0, 120)
        }))
        .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
      return Response.json({ ok: true, visits });
    }

    if (action === 'banDevice') {
      const deviceId = typeof body?.device_id === 'string' ? body.device_id.trim() : '';
      if (!deviceId) return Response.json({ error: 'device_id is required' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.Banned.filter({ device_id: deviceId });
      if (!existing || existing.length === 0) {
        await base44.asServiceRole.entities.Banned.create({
          device_id: deviceId,
          notes: typeof body?.notes === 'string' ? body.notes : 'Blocked from Visits page'
        });
      }
      return Response.json({ ok: true });
    }

    if (action === 'banNetwork') {
      const ip = typeof body?.ip === 'string' ? body.ip.trim() : '';
      if (!ip) return Response.json({ error: 'ip is required' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.BlockedNetwork.filter({ ip });
      if (!existing || existing.length === 0) {
        await base44.asServiceRole.entities.BlockedNetwork.create({
          ip,
          label: typeof body?.label === 'string' ? body.label : 'Blocked from Visits page',
          notes: typeof body?.notes === 'string' ? body.notes : 'Blocked from Visits page'
        });
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}