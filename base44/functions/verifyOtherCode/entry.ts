import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Verifies the access code for the hidden "Other" tool against the salted
// hash stored in the OtherCode dataset. The hash never leaves the server.
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!code || code.length > 200) {
      return Response.json({ ok: false, error: "Invalid code" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const rows = await base44.asServiceRole.entities.OtherCode.list(5);
    const record = rows && rows[0];
    if (!record || !record.hash) {
      return Response.json({ ok: false, error: "No access code configured" }, { status: 500 });
    }

    const hash = await sha256Hex(`${record.salt || ""}${code}`);
    return Response.json({ ok: hash === record.hash });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}