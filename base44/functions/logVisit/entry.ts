import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    let path = null;
    try {
      const body = await req.json();
      path = body?.path ?? null;
    } catch {
      path = null;
    }
    const ip =
      req.headers.get("cf-connecting-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "";

    const base44 = createClientFromRequest(req);

    // Is this visitor's IP on the banned list?
    const banned = await base44.asServiceRole.entities.Banned.filter({ ip: ip });

    await base44.asServiceRole.entities.VisitLog.create({
      ip: ip,
      path: path || "/",
      user_agent: userAgent
    });

    return Response.json({ ok: true, banned: banned.length > 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}