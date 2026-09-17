import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    let path = null;
    let deviceId = null;
    try {
      const body = await req.json();
      path = body?.path ?? null;
      deviceId = body?.device_id ?? null;
    } catch {
      path = null;
    }
    const ip =
      req.headers.get("cf-connecting-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "";

    const base44 = createClientFromRequest(req);

    // Is this device (by ID) or IP on the banned list?
    const bannedByIp = await base44.asServiceRole.entities.Banned.filter({ ip });
    let banned = bannedByIp.length > 0;
    if (!banned && deviceId) {
      const bannedByDevice = await base44.asServiceRole.entities.Banned.filter({ device_id: deviceId });
      banned = bannedByDevice.length > 0;
    }

    await base44.asServiceRole.entities.VisitLog.create({
      ip: ip,
      device_id: deviceId || "unknown",
      path: path || "/",
      user_agent: userAgent
    });

    return Response.json({ ok: true, banned: banned });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}