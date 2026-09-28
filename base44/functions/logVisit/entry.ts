import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    let path = null;
    let deviceId = null;
    let clientIp = null;
    try {
      const body = await req.json();
      path = body?.path ?? null;
      deviceId = body?.device_id ?? null;
      clientIp = body?.client_ip ?? null;
    } catch {
      path = null;
    }
    const headerIp =
      req.headers.get("cf-connecting-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "";

    const base44 = createClientFromRequest(req);

    // Check every IP we know for this visitor: the one the server sees
    // AND the real public IP the browser reported for itself.
    const ips = [headerIp];
    if (clientIp && typeof clientIp === "string" && clientIp.includes(".") && !ips.includes(clientIp)) {
      ips.push(clientIp);
    }

    // Is this device (by ID) or any of its IPs on the banned list?
    const bans = await base44.asServiceRole.entities.Banned.list(200);
    let banned = bans.some((b) =>
      (b.ip && ips.includes(b.ip)) || (deviceId && b.device_id === deviceId)
    );

    // Is this visitor coming from a blocked WiFi network (matched by its public IP)?
    if (!banned) {
      const blockedNetworks = await base44.asServiceRole.entities.BlockedNetwork.list(200);
      banned = blockedNetworks.some((n) => n.ip && ips.includes(n.ip));
    }

    await base44.asServiceRole.entities.VisitLog.create({
      ip: headerIp,
      client_ip: clientIp || headerIp,
      device_id: deviceId || "unknown",
      path: path || "/",
      user_agent: userAgent
    });

    // Keep a record of every device that has visited the site.
    if (deviceId) {
      const existing = await base44.asServiceRole.entities.Device.filter({ device_id: deviceId });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Device.update(existing[0].id, {
          ip: clientIp || headerIp,
          user_agent: userAgent
        });
      } else {
        await base44.asServiceRole.entities.Device.create({
          device_id: deviceId,
          ip: clientIp || headerIp,
          user_agent: userAgent
        });
      }
    }

    return Response.json({ ok: true, banned: banned });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}