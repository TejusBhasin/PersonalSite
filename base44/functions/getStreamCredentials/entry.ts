import { secrets } from "base44:runtime";
import { requirePass } from "../../shared/mp3nowAuth.ts";

// Hands the shared folder link to a device that has entered the MP3now passcode so the
// browser can decrypt audio locally. Never downloaded or returned by any other route.
export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { error } = await requirePass(req, body.pass);
    if (error) return error;

    const url = secrets.get("MEGA_FOLDER_URL");
    if (!url) {
      return Response.json({ error: "MEGA_FOLDER_URL is not set for this app." }, { status: 400 });
    }
    return Response.json({ url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}