import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { clientIp, isRateLimited, noteAttempt, secretMatches } from '../../shared/guard.ts';
import { issuePassToken } from '../../shared/mp3nowAuth.ts';

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

// Checks the passcode that unlocks MP3now against the TPASS secret. The secret never
// leaves the server, the comparison goes through fixed-length digests (so neither the
// value nor its length leaks), and each caller address is throttled. A correct passcode
// returns a signed token that the rest of MP3now accepts instead of the passcode itself.
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
    if (
      await isRateLimited(base44, throttleKey, {
        max: MAX_ATTEMPTS,
        windowMs: WINDOW_MS,
        globalMax: 40,
        scope: 'mp3now',
      })
    ) {
      return Response.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const ok = await secretMatches(code, expected);
    if (!ok) {
      await noteAttempt(base44, throttleKey, { windowMs: WINDOW_MS, scope: 'mp3now' });
      return Response.json({ ok: false });
    }
    return Response.json({ ok: true, token: await issuePassToken() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}