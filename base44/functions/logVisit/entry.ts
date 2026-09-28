import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const ipToInt = (s) => {
  const m = String(s).match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  return (((+m[1] << 24) | (+m[2] << 16) | (+m[3] << 8)) | +m[4]) >>> 0;
};

// Checks whether an IP falls inside a CIDR range like "192.168.1.0/24".
const cidrMatch = (ip, cidr) => {
  const [base, bitsStr] = String(cidr).split("/");
  const bits = parseInt(bitsStr ?? "32", 10);
  if (Number.isNaN(bits) || bits < 0 || bits > 32) return false;
  const ipInt = ipToInt(ip);
  const baseInt = ipToInt(base);
  if (ipInt === null || baseInt === null) return false;
  const mask = bits === 0 ? 0 : (0xFFFFFFFF << (32 - bits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
};

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

    // Is this device (by ID), exact IP, or WiFi/network IP range on the banned list?
    const bans = await base44.asServiceRole.entities.Banned.list(200);
    const banned = bans.some((b) =>
      b.ip === ip ||
      (deviceId && b.device_id === deviceId) ||
      (b.cidr && cidrMatch(ip, b.cidr))
    );

    await base44.asServiceRole.entities.VisitLog.create({
      ip: ip,
      device_id: deviceId || "unknown",
      path: path || "/",
      user_agent: userAgent
    });

    // Keep a record of every device that has visited the site.
    if (deviceId) {
      const existing = await base44.asServiceRole.entities.Device.filter({ device_id: deviceId });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Device.update(existing[0].id, {
          ip: ip,
          user_agent: userAgent
        });
      } else {
        await base44.asServiceRole.entities.Device.create({
          device_id: deviceId,
          ip: ip,
          user_agent: userAgent
        });
      }
    }

    return Response.json({ ok: true, banned: banned });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}