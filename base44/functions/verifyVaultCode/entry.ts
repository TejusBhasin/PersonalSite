import { secrets } from "base44:runtime";

// Gates the YT-DPL tool. The vault URL is only returned once the visitor types
// the access code held in the YT_DPL_ACCESS_CODE secret.
const VAULT_URL = "https://stream-arch-vault.base44.app/";

function same(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!code || code.length > 200) {
      return Response.json({ ok: false, error: "Enter the access code" }, { status: 400 });
    }

    const expected = secrets.get("YT_DPL_ACCESS_CODE");
    if (!expected) {
      return Response.json({ ok: false, error: "No access code configured" }, { status: 500 });
    }

    if (!same(code, expected.trim())) {
      return Response.json({ ok: false, error: "That code isn't right" }, { status: 200 });
    }

    return Response.json({ ok: true, url: VAULT_URL });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}