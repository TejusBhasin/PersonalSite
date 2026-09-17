import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const SITE_PASSWORD = "LoveBoba2016$$";
const MAX_ATTEMPTS = 10;

export default async function(req) {
  try {
    let password = null;
    let deviceId = null;
    try {
      const body = await req.json();
      password = body?.password ?? null;
      deviceId = body?.device_id ?? null;
    } catch {
      password = null;
    }

    const ip =
      req.headers.get("cf-connecting-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      "unknown";

    // Identify the device primarily by its persistent ID — rotating IPs won't help.
    const identifier = deviceId || ip;

    const base44 = createClientFromRequest(req);

    // Already banned — no access, no attempts counted.
    const bannedByIp = await base44.asServiceRole.entities.Banned.filter({ ip });
    const bannedByDevice = await base44.asServiceRole.entities.Banned.filter({ device_id: identifier });
    if (bannedByIp.length > 0 || bannedByDevice.length > 0) {
      return Response.json({ ok: false, banned: true });
    }

    if (password === SITE_PASSWORD) {
      // Correct password — clear this device's failed attempts.
      await base44.asServiceRole.entities.FailedAttempts.deleteMany({ device_id: identifier });
      return Response.json({ ok: true });
    }

    // Wrong password — count the failure for this device.
    const attempts = await base44.asServiceRole.entities.FailedAttempts.filter({ device_id: identifier });
    if (attempts.length === 0) {
      await base44.asServiceRole.entities.FailedAttempts.create({ device_id: identifier, count: 1 });
      return Response.json({ ok: false, attempts_left: MAX_ATTEMPTS - 1 });
    }

    const record = attempts[0];
    const count = (record.count || 0) + 1;

    if (count >= MAX_ATTEMPTS) {
      // Permanently ban this device — by ID and IP.
      await base44.asServiceRole.entities.Banned.create({ ip: ip, device_id: identifier });
      await base44.asServiceRole.entities.FailedAttempts.deleteMany({ device_id: identifier });
      return Response.json({ ok: false, banned: true });
    }

    await base44.asServiceRole.entities.FailedAttempts.update(record.id, { count });
    return Response.json({ ok: false, attempts_left: MAX_ATTEMPTS - count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}