import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// The machine-readable list of public Invidious instances that the
// iv-org/documentation repo (docs/instances.md) publishes as its official source.
const INSTANCES_URL = "https://api.invidious.io/instances.json?sort_by=type,health";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Direct invocations from the app must come from an admin.
    // Scheduled workflow runs have no user context and are allowed.
    try {
      const user = await base44.auth.me();
      if (user && user.role !== "admin") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      // no user context (scheduled run)
    }

    const res = await fetch(INSTANCES_URL, {
      headers: { "User-Agent": "tejus-site-sync" },
      signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) {
      return Response.json({ error: "Could not reach the Invidious instances API" }, { status: 502 });
    }
    const raw = await res.json();
    if (!Array.isArray(raw)) {
      return Response.json({ error: "Unexpected instances payload" }, { status: 502 });
    }

    // Only public clearnet (https) instances belong on the page.
    const records = [];
    raw.forEach(([name, inst], idx) => {
      if (!inst || !inst.uri || inst.type !== "https") return;
      const stats = inst.stats || {};
      const software = stats.software || {};
      const monitor = inst.monitor || {};
      const usageUsers = (stats.usage && stats.usage.users) || {};
      records.push({
        name,
        uri: inst.uri,
        flag: inst.flag || "",
        region: inst.region || "",
        type: inst.type,
        api: Boolean(inst.api),
        cors: Boolean(inst.cors),
        uptime: typeof monitor.uptime === "number" ? monitor.uptime : 0,
        down: Boolean(monitor.down),
        error: monitor.error || "",
        version: software.version || "",
        branch: software.branch || "",
        users: typeof usageUsers.total === "number" ? usageUsers.total : 0,
        open_registrations: Boolean(stats.openRegistrations),
        sort_order: idx
      });
    });

    if (records.length === 0) {
      return Response.json({ error: "No public instances found" }, { status: 502 });
    }

    // Full weekly sync: the official list is the source of truth.
    // Update existing records in place, add new ones, remove retired ones.
    const existing = await base44.asServiceRole.entities.InvidiousInstance.list(200);
    const byName = new Map(existing.map((r) => [r.name, r]));
    const incomingNames = new Set(records.map((r) => r.name));

    const updates = [];
    const creates = [];
    for (const rec of records) {
      const cur = byName.get(rec.name);
      if (cur) updates.push({ id: cur.id, ...rec });
      else creates.push(rec);
    }

    if (creates.length > 0) {
      await base44.asServiceRole.entities.InvidiousInstance.bulkCreate(creates);
    }
    if (updates.length > 0) {
      await base44.asServiceRole.entities.InvidiousInstance.bulkUpdate(updates);
    }
    const removed = existing.filter((r) => !incomingNames.has(r.name));
    for (const r of removed) {
      await base44.asServiceRole.entities.InvidiousInstance.delete(r.id);
    }

    return Response.json({
      ok: true,
      synced: records.length,
      created: creates.length,
      updated: updates.length,
      removed: removed.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}