import { useEffect, useRef, useState } from "react";
import { Captions, Gauge, Loader2, SlidersHorizontal } from "lucide-react";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// Overlay controls for the Vidious player, wired to the official
// Invidious API: /api/v1/captions/{id} lists the tracks,
// /api/v1/captions/{id}?label= serves the WebVTT (attached as a blob
// text track), and dash.js representations power the quality selector.

const btn = (on) =>
  `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
    on ? "bg-white text-black" : "bg-black/60 text-white hover:bg-black/80"
  }`;

const panel = "absolute bottom-full mb-2 left-0 z-20 bg-neutral-900 border border-neutral-700 rounded-lg max-h-56 overflow-y-auto min-w-36 py-1 text-xs";

export default function StreamControls({ videoRef, playerRef, instance, videoId, compact = false }) {
  const [menu, setMenu] = useState("");
  const [captions, setCaptions] = useState(null);
  const [activeCc, setActiveCc] = useState("");
  const [busy, setBusy] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [qualities, setQualities] = useState(null);
  const [quality, setQuality] = useState("auto");
  const blobs = useRef([]);

  // New video: drop caption tracks we attached and reset state.
  useEffect(() => {
    setMenu("");
    setCaptions(null);
    setActiveCc("");
    setSpeed(1);
    setQualities(null);
    setQuality("auto");
    for (const url of blobs.current) URL.revokeObjectURL(url);
    blobs.current = [];
    const v = videoRef.current;
    if (v) for (const t of Array.from(v.querySelectorAll("track"))) t.remove();
  }, [videoId, videoRef]);

  const openCc = async () => {
    if (menu === "cc") { setMenu(""); return; }
    setMenu("cc");
    if (captions !== null || !instance) return;
    setBusy(true);
    try {
      const r = await fetch(`${instance}/api/v1/captions/${videoId}`, { signal: AbortSignal.timeout(10000) });
      const d = r.ok ? await r.json() : null;
      setCaptions(d && Array.isArray(d.captions) ? d.captions : []);
    } catch {
      setCaptions([]);
    } finally {
      setBusy(false);
    }
  };

  const pickCaption = async (cap) => {
    const v = videoRef.current;
    setMenu("");
    if (!v) return;
    if (!cap) {
      for (const t of v.textTracks) t.mode = "disabled";
      setActiveCc("");
      return;
    }
    if (!instance || busy) return;
    setBusy(true);
    try {
      const r = await fetch(
        `${instance}/api/v1/captions/${videoId}?label=${encodeURIComponent(cap.label)}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const text = r.ok ? await r.text() : "";
      if (!text) throw new Error("empty captions");
      const url = URL.createObjectURL(new Blob([text], { type: "text/vtt" }));
      blobs.current.push(url);
      for (const t of Array.from(v.querySelectorAll("track"))) t.remove();
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = cap.label;
      track.srclang = cap.languageCode || "en";
      track.src = url;
      v.appendChild(track);
      requestAnimationFrame(() => {
        for (const t of v.textTracks) t.mode = t.label === cap.label ? "showing" : "disabled";
      });
      setActiveCc(cap.label);
    } catch {
      setCaptions([]);
    } finally {
      setBusy(false);
    }
  };

  const pickSpeed = (s) => {
    const v = videoRef.current;
    if (v) v.playbackRate = s;
    setSpeed(s);
    setMenu("");
  };

  const openQuality = () => {
    if (menu === "quality") { setMenu(""); return; }
    setMenu("quality");
    const player = playerRef?.current;
    let reps = [];
    try {
      reps = player && player.getRepresentationsByType ? player.getRepresentationsByType("video") : [];
    } catch {
      reps = [];
    }
    setQualities(reps.map((r) => ({
      id: r.id,
      label: r.height ? `${r.height}p` : `${Math.round((r.bandwidth || 0) / 1000)}k`
    })));
  };

  const pickQuality = (q) => {
    const player = playerRef?.current;
    setQuality(q);
    setMenu("");
    if (!player) return;
    try {
      if (q === "auto") {
        player.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: true } } } });
      } else {
        player.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: false } } } });
        if (player.setRepresentationForTypeById) player.setRepresentationForTypeById("video", q, true);
      }
    } catch {
      // leave ABR as-is
    }
  };

  const item = (label, on, onClick, key) => (
    <button
      key={key}
      onClick={onClick}
      className={`w-full text-left px-3 py-2 hover:bg-neutral-800 ${on ? "text-[#ff4d4d] font-bold" : "text-neutral-200"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="relative flex items-center gap-1.5">
      {menu && <div className="fixed inset-0 z-10" onClick={() => setMenu("")} />}

      <button onClick={openCc} className={btn(activeCc)}>
        <Captions className="w-3.5 h-3.5" />
        {activeCc ? activeCc.slice(0, 9) : "CC"}
      </button>
      <button onClick={() => setMenu(menu === "speed" ? "" : "speed")} className={btn(speed !== 1)}>
        <Gauge className="w-3.5 h-3.5" />
        {speed}x
      </button>
      {!compact && (
        <button onClick={openQuality} className={btn(quality !== "auto")}>
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {quality === "auto" ? "Auto" : quality}
        </button>
      )}

      {menu === "cc" && (
        <div className={panel}>
          {busy && (
            <div className="px-3 py-2 text-neutral-500 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
            </div>
          )}
          {!busy && captions !== null && (
            <>
              {item("Off", activeCc === "", () => pickCaption(null), "off")}
              {captions.map((c) => item(c.label, activeCc === c.label, () => pickCaption(c), c.label))}
              {captions.length === 0 && <div className="px-3 py-2 text-neutral-500">No captions</div>}
            </>
          )}
        </div>
      )}
      {menu === "speed" && (
        <div className={panel}>
          {SPEEDS.map((s) => item(`${s}x`, speed === s, () => pickSpeed(s), `s${s}`))}
        </div>
      )}
      {menu === "quality" && (
        <div className={panel}>
          {item("Auto", quality === "auto", () => pickQuality("auto"), "qauto")}
          {(qualities || []).map((q) => item(q.label, quality === q.id, () => pickQuality(q.id), q.id))}
          {qualities && qualities.length === 0 && <div className="px-3 py-2 text-neutral-500">Auto only</div>}
        </div>
      )}
    </div>
  );
}