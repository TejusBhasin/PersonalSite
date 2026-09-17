import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const SITE_PASSWORD = "LoveBoba2016$$";
const MAX_ATTEMPTS = 10;

export default async function(req) {
  try {
    let password = null;
    try {
      const body = await req.json();
      password = body?.password ?? null;
    } catch {
      password = null;
    }

    const ip =
      req.headers.get("cf-connecting-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      "unknown";

    const base44 = createClientFromRequest(req);

    // Already banned — no access, no attempts counted.
    const banned = await base44.asServiceRole.entities.Banned.filter({ ip });
    if (banned.length > 0) {
      return Response.json({ ok: false, banned: true });
    }

    if (password === SITE_PASSWORD) {
      // Correct password — clear this device's failed attempts.
      const attempts = await base44.asServiceRole.entities.FailedAttempts.filter({ ip });
      if (attempts.length > 0) {
        await base44.asServiceRole.entities.FailedAttempts.deleteMany({ ip });
      }
      return Response.json({ ok: true });
    }

    // Wrong password — count the failure for this device.
    const attempts = await base44.asServiceRole.entities.FailedAttempts.filter({ ip });
    if (attempts.length === 0) {
      await base44.asServiceRole.entities.FailedAttempts.create({ ip, count: 1 });
      return Response.json({ ok: false, attempts_left: MAX_ATTEMPTS - 1 });
    }

    const record = attempts[0];
    const count = (record.count || 0) + 1;

    if (count >= MAX_ATTEMPTS) {
      // Permanently ban this device.
      await base44.asServiceRole.entities.Banned.create({ ip });
      await base44.asServiceRole.entities.FailedAttempts.deleteMany({ ip });
      return Response.json({ ok: false, banned: true });
    }

    await base44.asServiceRole.entities.FailedAttempts.update(record.id, { count });
    return Response.json({ ok: false, attempts_left: MAX_ATTEMPTS - count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}