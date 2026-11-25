import { secrets } from 'base44:runtime';

// Compares without leaking length or early-exit timing, so the passcode cannot be
// guessed by measuring how long a rejection takes.
function matches(input: string, expected: string): boolean {
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

// Checks the passcode that unlocks MP3now against the TPASS secret. The secret never
// leaves the server; the client only ever learns whether the code was right.
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

    return Response.json({ ok: matches(code, expected) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}