const SITE_PASSWORD = "LoveBoba2016$$";

export default async function(req) {
  try {
    let password = null;
    try {
      const body = await req.json();
      password = body?.password ?? null;
    } catch {
      password = null;
    }
    return Response.json({ ok: password === SITE_PASSWORD });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}