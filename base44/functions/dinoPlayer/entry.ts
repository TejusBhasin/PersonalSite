import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  clearAttempts,
  clientIp,
  isRateLimited,
  matches,
  noteAttempt,
  randomHex,
  sha256Hex,
} from '../../shared/guard.ts';

// Dino accounts and scores. Passwords are stored as a salted SHA-256 hash and never leave
// the server; a sign-in hands back a session token instead, so the browser keeps no
// password. Accounts created before hashing are upgraded the next time they sign in.
const BOARD_SIZE = 12;
const LOGIN_MAX = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const hashPassword = (salt, password) => sha256Hex(`${salt}${password}`);

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === 'string' ? body.action : 'leaderboard';
    const base44 = createClientFromRequest(req);
    const players = base44.asServiceRole.entities.DinoPlayer;
    const throttleKey = `dino:${clientIp(req)}`;

    const leaderboard = async () => {
      const page = await players.filter({}, { sort: '-best_score', limit: BOARD_SIZE });
      const items = Array.isArray(page) ? page : (page?.items || []);
      return items
        .filter((p) => (p.best_score || 0) > 0)
        .map((p, i) => ({ rank: i + 1, username: p.username, score: p.best_score }));
    };

    if (action === 'leaderboard') {
      return Response.json({ ok: true, leaderboard: await leaderboard() });
    }

    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const token = typeof body?.token === 'string' ? body.token : '';
    if (username.length < 3 || username.length > 16) {
      return Response.json({ error: 'Username must be 3-16 characters.' }, { status: 400 });
    }
    if (!/^[A-Za-z0-9_. -]+$/.test(username)) {
      return Response.json({ error: 'Letters, numbers, spaces, dots, dashes and underscores only.' }, { status: 400 });
    }
    // A score submission may authenticate with its session token instead of a password.
    const tokenSubmit = action === 'submit' && token.length > 0;
    if (!tokenSubmit && (password.length < 4 || password.length > 40)) {
      return Response.json({ error: 'Password must be 4-40 characters.' }, { status: 400 });
    }

    const handle = username.toLowerCase();

    if (action === 'register') {
      if (await isRateLimited(base44, throttleKey, { max: LOGIN_MAX, windowMs: LOGIN_WINDOW_MS })) {
        return Response.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
      }
      const existing = await players.filter({ handle }, { limit: 1 });
      const rows = Array.isArray(existing) ? existing : (existing?.items || []);
      if (rows.length > 0) {
        return Response.json({ error: 'That username is already taken.' }, { status: 409 });
      }
      const salt = randomHex(16);
      const sessionToken = randomHex(24);
      const created = await players.create({
        username,
        handle,
        salt,
        password_hash: await hashPassword(salt, password),
        session_token: sessionToken,
        best_score: 0,
      });
      await clearAttempts(base44, throttleKey);
      return Response.json({
        ok: true,
        token: sessionToken,
        player: { username: created.username, best_score: created.best_score || 0 },
        leaderboard: await leaderboard(),
      });
    }

    if (action === 'login' || action === 'submit') {
      if (await isRateLimited(base44, throttleKey, { max: LOGIN_MAX, windowMs: LOGIN_WINDOW_MS })) {
        return Response.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
      }

      const found = await players.filter({ handle }, { limit: 1 });
      const rows = Array.isArray(found) ? found : (found?.items || []);
      const record = rows[0];

      let authorised = false;
      let patch = null;

      if (!record) {
        authorised = false;
      } else if (tokenSubmit && record.session_token) {
        authorised = matches(token, record.session_token);
      } else if (record.password_hash) {
        authorised = matches(await hashPassword(record.salt || '', password), record.password_hash);
      } else if (typeof record.password === 'string' && record.password) {
        // Account created before hashing: check the old value once, then keep only the hash.
        if (matches(password, record.password)) {
          authorised = true;
          const salt = randomHex(16);
          patch = { salt, password_hash: await hashPassword(salt, password), password: '' };
        }
      }

      if (!authorised) {
        await noteAttempt(base44, throttleKey, { windowMs: LOGIN_WINDOW_MS });
        return Response.json({ error: 'Wrong username or password.' }, { status: 401 });
      }

      await clearAttempts(base44, throttleKey);

      if (action === 'login') {
        const sessionToken = randomHex(24);
        await players.update(record.id, { ...(patch || {}), session_token: sessionToken });
        return Response.json({
          ok: true,
          token: sessionToken,
          player: { username: record.username, best_score: record.best_score || 0 },
          leaderboard: await leaderboard(),
        });
      }

      const raw = Math.floor(Number(body?.score));
      if (!Number.isFinite(raw) || raw <= 0) {
        return Response.json({ error: 'Invalid score.' }, { status: 400 });
      }
      const score = Math.min(raw, 100000);
      const previous = record.best_score || 0;
      let best = previous;
      if (score > previous) {
        await players.update(record.id, { ...(patch || {}), best_score: score });
        best = score;
      } else if (patch) {
        await players.update(record.id, patch);
      }
      return Response.json({
        ok: true,
        best_score: best,
        personal_best: score > previous,
        leaderboard: await leaderboard(),
      });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}