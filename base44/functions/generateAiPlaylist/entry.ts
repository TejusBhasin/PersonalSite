import { requireAdmin, fetchAllPages } from "../../shared/mp3nowAuth.ts";

const MAX_INDEX = 1500;

function compactLine(track) {
  return [track.id, track.title, track.artist, track.album, track.genre || "", track.folderPath || ""].join(" | ");
}

export default async function (req) {
  try {
    const { error, base44 } = await requireAdmin(req);
    if (error) return error;

    const body = await req.json().catch(() => ({}));
    const prompt = String(body.prompt || "").trim();
    if (!prompt) return Response.json({ error: "Describe the playlist you want." }, { status: 400 });

    const count = Math.min(Math.max(Number(body.count) || 20, 5), 60);

    const tracks = await fetchAllPages(base44, "Track", {}, 500, MAX_INDEX);
    const playable = tracks.filter((t) => t.id && t.title);
    if (playable.length === 0) {
      return Response.json({ error: "The library is empty. Sync your MEGA folders first." }, { status: 400 });
    }

    const index = playable.map(compactLine).join("\n");
    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: [
        "You are a music curator building a private playlist from the owner's own library.",
        "Pick only tracks that exist in the index below. Prefer a coherent mood, energy and flow.",
        `Choose exactly ${Math.min(count, playable.length)} tracks, ordered for listening.`,
        "Each line of the index is: id | title | artist | album | genre | folder.",
        "",
        `Request: ${prompt}`,
        "",
        "Library index:",
        index,
      ].join("\n"),
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Short playlist name, max 40 characters" },
          description: { type: "string", description: "One sentence about the mix" },
          trackIds: { type: "array", items: { type: "string" }, description: "Ids copied exactly from the index" },
        },
        required: ["name", "trackIds"],
      },
    });

    const data = typeof llm === "string" ? JSON.parse(llm) : llm;
    const valid = new Set(playable.map((t) => t.id));
    const chosen = [];
    for (const id of data?.trackIds || []) {
      if (valid.has(id) && !chosen.includes(id)) chosen.push(id);
    }
    if (chosen.length === 0) {
      return Response.json({ error: "The assistant could not match any tracks. Try a different prompt." }, { status: 502 });
    }

    const byId = new Map(playable.map((t) => [t.id, t]));
    const cover = chosen.map((id) => byId.get(id)?.coverArtDataUrl).find(Boolean) || "";

    const playlist = await base44.asServiceRole.entities.Playlist.create({
      name: String(data.name || "AI Mix").slice(0, 60),
      description: String(data.description || prompt).slice(0, 240),
      isMegaSynced: false,
      isAiGenerated: true,
      trackCount: chosen.length,
      coverArtDataUrl: cover,
    });

    const rows = chosen.map((trackId, position) => ({ playlistId: playlist.id, trackId, position }));
    await base44.asServiceRole.entities.PlaylistTrack.bulkCreate(rows);

    return Response.json({ playlist, trackIds: chosen });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}