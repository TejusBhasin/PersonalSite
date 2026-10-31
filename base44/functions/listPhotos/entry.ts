// Lists the images in the public Drive photo folder so the site can show them
// in its own gallery: watermarked, without Drive's viewer chrome, and with no
// download / "open in Drive" affordances. Google renders the embedded folder as
// plain HTML, so the file ids and names are read from that markup and the
// pictures themselves are served from Google's public image CDN.

const FOLDER_ID = "1-IZTBsJM0iz6aLq8JvlHuviEnE-LmqZ6";
const IMAGE = /\.(jpe?g|png|webp|gif|avif|heic)$/i;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

export default async function (req) {
  try {
    const res = await fetch(
      `https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}#grid`,
      { signal: AbortSignal.timeout(15000), headers: { "User-Agent": UA } }
    );
    if (!res.ok) {
      return Response.json({ error: "Folder unavailable" }, { status: 502 });
    }

    const html = await res.text();
    const photos = html
      .split('class="flip-entry"')
      .slice(1)
      .map((block) => {
        const idMatch = block.match(/id="entry-([A-Za-z0-9_-]+)"/);
        if (!idMatch) return null;
        const titleMatch = block.match(/class="flip-entry-title">([^<]*)</);
        const name = decode(titleMatch ? titleMatch[1] : "photo");
        if (!IMAGE.test(name)) return null;
        const id = idMatch[1];
        return {
          id,
          name,
          thumb: `https://lh3.googleusercontent.com/d/${id}=w600`,
          full: `https://lh3.googleusercontent.com/d/${id}=w1600`,
        };
      })
      .filter(Boolean)
      .slice(0, 200);

    return Response.json({ photos });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}