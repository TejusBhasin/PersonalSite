// Shared guards for the app's public backend functions. They are reached by visitors who
// are not signed in, so everything here is written to work with the service role and to
// trust only what the server itself observes.

const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const IPV6 = /^[0-9a-f:]+$/i;

const DEFAULT_MAX = 8;
const DEFAULT_WINDOW = 15 * 60 * 1000;

export function isValidIp(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const ip = value.trim();
  if (IPV4.test(ip)) return true;
  return ip.includes(':') && ip.length <= 45 && IPV6.test(ip);
}

// The address the server sees. A caller-reported address is never used for a security
// decision: anyone can claim to come from any IP.
export function clientIp(req: Request): string {
  const header =
    req.headers.get('cf-connecting-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return isValidIp(header) ? header.trim() : 'unknown';
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time comparison, so a wrong value cannot be narrowed down by timing.
export function matches(a: unknown, b: unknown): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Compares through fixed-length digests: the value and its length both stay secret.
export async function secretMatches(input: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256Hex(input), sha256Hex(expected)]);
  return matches(a, b);
}

export function randomHex(bytes = 24): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function attemptRow(base44: any, key: string) {
  const rows = await base44.asServiceRole.entities.AuthAttempt.filter({ key }, { limit: 1 });
  return (Array.isArray(rows) ? rows : rows?.items || [])[0] || null;
}

async function overLimit(base44: any, key: string, max: number, windowMs: number): Promise<boolean> {
  const row = await attemptRow(base44, key);
  if (!row) return false;
  const started = Date.parse(row.window_start || '');
  if (!Number.isFinite(started) || Date.now() - started > windowMs) return false;
  return (row.count || 0) >= max;
}

async function bump(base44: any, key: string, windowMs: number): Promise<void> {
  const now = new Date().toISOString();
  const row = await attemptRow(base44, key);
  if (!row) {
    await base44.asServiceRole.entities.AuthAttempt.create({ key, count: 1, window_start: now });
    return;
  }
  const started = Date.parse(row.window_start || '');
  const stale = !Number.isFinite(started) || Date.now() - started > windowMs;
  await base44.asServiceRole.entities.AuthAttempt.update(row.id, {
    count: stale ? 1 : (row.count || 0) + 1,
    window_start: stale ? now : row.window_start,
  });
}

// True once the key has used up its attempts inside the current window. The caller's
// address can rotate (proxies, mobile networks), so a scope may also carry a cap across
// every caller: guessing stays bounded even when the per-address key keeps changing.
export async function isRateLimited(
  base44: any,
  key: string,
  {
    max = DEFAULT_MAX,
    windowMs = DEFAULT_WINDOW,
    globalMax = 0,
    scope = '',
  }: { max?: number; windowMs?: number; globalMax?: number; scope?: string } = {},
): Promise<boolean> {
  if (await overLimit(base44, key, max, windowMs)) return true;
  if (globalMax > 0 && scope) return overLimit(base44, `global:${scope}`, globalMax, windowMs);
  return false;
}

export async function noteAttempt(
  base44: any,
  key: string,
  { windowMs = DEFAULT_WINDOW, scope = '' }: { windowMs?: number; scope?: string } = {},
): Promise<void> {
  await bump(base44, key, windowMs);
  if (scope) await bump(base44, `global:${scope}`, windowMs);
}

export async function clearAttempts(base44: any, key: string): Promise<void> {
  await base44.asServiceRole.entities.AuthAttempt.deleteMany({ key }).catch(() => null);
}