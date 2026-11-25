import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { clientIp, isRateLimited, matches, noteAttempt } from '../../shared/guard.ts';

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

// Verifies the access code for the hidden "Other" tool against the salted hash stored in
// the OtherCode dataset. The hash never leaves the server, the comparison is constant
// time, and each caller address is throttled so the code cannot be guessed by repetition.
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
    const throttleKey = `other:${clientIp(req)}`;
    if (
      await isRateLimited(base44, throttleKey, {
        max: MAX_ATTEMPTS,
        windowMs: WINDOW_MS,
        globalMax: 40,
        scope: 'other',
      })
    ) {
      return Response.json({ ok: false, error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const page = await base44.asServiceRole.entities.OtherCode.list({ limit: 5 });
    const rows = Array.isArray(page) ? page : (page?.items || []);
    const record = rows[0];
    if (!record || !record.hash) {
      return Response.json({ ok: false, error: "No access code configured" }, { status: 500 });
    }

    const hash = await sha256Hex(`${record.salt || ""}${code}`);
    const ok = matches(hash, record.hash);
    if (!ok) {
      await noteAttempt(base44, throttleKey, { windowMs: WINDOW_MS, scope: 'other' });
    }
    return Response.json({ ok });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}