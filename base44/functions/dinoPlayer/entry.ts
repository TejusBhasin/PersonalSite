import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Dino accounts and scores. Passwords are stored as typed (no hashing) by request,
// and the DinoPlayer records are only reachable through this function.
const BOARD_SIZE = 12;

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === 'string' ? body.action : 'leaderboard';
    const base44 = createClientFromRequest(req);
    const players = base44.asServiceRole.entities.DinoPlayer;

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
    if (username.length < 3 || username.length > 16) {
      return Response.json({ error: 'Username must be 3-16 characters.' }, { status: 400 });
    }
    if (!/^[A-Za-z0-9_. -]+$/.test(username)) {
      return Response.json({ error: 'Letters, numbers, spaces, dots, dashes and underscores only.' }, { status: 400 });
    }
    if (password.length < 4 || password.length > 40) {
      return Response.json({ error: 'Password must be 4-40 characters.' }, { status: 400 });
    }

    const handle = username.toLowerCase();

    if (action === 'register') {
      const existing = await players.filter({ handle }, { limit: 1 });
      const rows = Array.isArray(existing) ? existing : (existing?.items || []);
      if (rows.length > 0) {
        return Response.json({ error: 'That username is already taken.' }, { status: 409 });
      }
      const created = await players.create({ username, handle, password, best_score: 0 });
      return Response.json({
        ok: true,
        player: { username: created.username, best_score: created.best_score || 0 },
        leaderboard: await leaderboard(),
      });
    }

    if (action === 'login' || action === 'submit') {
      const found = await players.filter({ handle }, { limit: 1 });
      const rows = Array.isArray(found) ? found : (found?.items || []);
      const record = rows[0];
      if (!record || record.password !== password) {
        return Response.json({ error: 'Wrong username or password.' }, { status: 401 });
      }

      if (action === 'login') {
        return Response.json({
          ok: true,
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
        await players.update(record.id, { best_score: score });
        best = score;
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