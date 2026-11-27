import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { secrets } from "base44:runtime";

// MP3now is a private single-owner app and it is unlocked by one passcode (the TPASS
// secret), not by an account. The passcode itself only ever travels to the unlock
// function; every other call carries a short signed token that proves the passcode was
// entered on this device. The token is an HMAC of its own expiry, so it cannot be forged
// and it needs no storage on the server.
const TOKEN_DAYS = 90;
const encoder = new TextEncoder();

function passSecret() {
  return (secrets.get("TPASS") || "").trim();
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function sameDigest(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function issuePassToken() {
  const secret = passSecret();
  if (!secret) throw new Error("The passcode is not configured");
  const expires = Date.now() + TOKEN_DAYS * 86400000;
  return `${expires}.${await sign(String(expires), secret)}`;
}

// Returns either { error: Response } or { base44 }. Callers must pass the token they
// received from mp3nowUnlock in the request body as `pass`.
export async function requirePass(req, token) {
  const secret = passSecret();
  if (!secret) {
    return { error: Response.json({ error: "The passcode is not configured" }, { status: 500 }) };
  }
  const [expires, signature] = String(token || "").split(".");
  if (!expires || !signature || Number(expires) < Date.now()) {
    return { error: Response.json({ error: "locked", code: "locked" }, { status: 401 }) };
  }
  if (!sameDigest(signature, await sign(expires, secret))) {
    return { error: Response.json({ error: "locked", code: "locked" }, { status: 401 }) };
  }
  return { base44: createClientFromRequest(req) };
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