import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { clientIp, isRateLimited, noteAttempt, secretMatches } from '../../shared/guard.ts';

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

// Checks the passcode that unlocks MP3now against the TPASS secret. The secret never
// leaves the server, the comparison goes through fixed-length digests (so neither the
// value nor its length leaks), and each caller address is throttled.
export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body?.code === 'string' ? body.code.trim() : '';
    if (!code || code.length > 200) {
      return Response.json({ error: 'A passcode is required' }, { status: 400 });
    }

    const expected = (secrets.get('TPASS') || '').trim();
    if (!expected) {
      return Response.json({ error: 'The passcode is not configured' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const throttleKey = `mp3now:${clientIp(req)}`;
    if (await isRateLimited(base44, throttleKey, { max: MAX_ATTEMPTS, windowMs: WINDOW_MS })) {
      return Response.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const ok = await secretMatches(code, expected);
    if (!ok) {
      await noteAttempt(base44, throttleKey, { windowMs: WINDOW_MS });
    }
    return Response.json({ ok });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}