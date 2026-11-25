import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// MP3now is a private single-owner app: every function behind it accepts only an
// admin-role app user. Returns either { error: Response } or { base44, user }.
export async function requireAdmin(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
  if (!user) {
    return { error: Response.json({ error: "Sign in to use MP3now." }, { status: 401 }) };
  }
  if (user.role !== "admin") {
    return { error: Response.json({ error: "This account does not have access to MP3now." }, { status: 403 }) };
  }
  return { base44, user };
}

// Reads a whole entity table in pages so the 5,000 item query cap never truncates it.
export async function fetchAllPages(base44, entityName, query = {}, pageSize = 500, max = 40000) {
  const rows = [];
  let cursor;
  while (rows.length < max) {
    const page = await base44.asServiceRole.entities[entityName].filter(query, {
      limit: pageSize,
      ...(cursor ? { cursor } : {}),
    });
    const items = Array.isArray(page) ? page : page?.items || [];
    rows.push(...items);
    const next = Array.isArray(page) ? null : page?.next_cursor;
    if (!items.length || !next || (Array.isArray(page) ? true : page?.has_more === false)) break;
    cursor = next;
  }
  return rows;
}

export function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}