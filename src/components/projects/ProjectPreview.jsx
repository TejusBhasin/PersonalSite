import { useState } from "react";
import { base44 } from "@/api/base44Client";

// Project preview image with a resilient fallback chain: the stored
// preview URL first, then the GitHub open-graph card for the repo, then
// a server-side fetch through the app itself (fixes networks that block
// the image hosts), and finally a styled placeholder that always shows.

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const ghOg = (url) => {
  const m = (url || "").match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
  return m ? `https://opengraph.githubassets.com/1/${m[1]}/${m[2]}` : "";
};

const readCache = (key) => {
  try { return JSON.parse(sessionStorage.getItem(key) || "null"); } catch { return null; }
};
const writeCache = (key, value) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full */ }
};

export default function ProjectPreview({ project, className = "" }) {
  const candidates = [...new Set([project.preview, ghOg(project.github_url), ghOg(project.url)].filter(Boolean))];
  const target = candidates[0] || "";
  const [pos, setPos] = useState(0);
  const [dataUri, setDataUri] = useState(target ? readCache(`pv:${target}`) : null);
  const [failed, setFailed] = useState(false);
  const [proxying, setProxying] = useState(false);

  const tryProxy = () => {
    if (!target) { setFailed(true); return; }
    if (proxying) return;
    setProxying(true);
    base44.functions.invoke("fetchPreview", { url: target })
      .then((res) => {
        const d = res?.data ?? res;
        if (d?.dataUri) {
          writeCache(`pv:${target}`, d.dataUri);
          setDataUri(d.dataUri);
        } else {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true))
      .finally(() => setProxying(false));
  };

  const onImgError = () => {
    if (pos < candidates.length - 1) setPos((p) => p + 1);
    else tryProxy();
  };

  if (dataUri) {
    return <img src={dataUri} alt={`${project.name} preview`} loading="lazy" decoding="async" className={className} />;
  }

  if (failed || !candidates.length || proxying) {
    return (
      <div className={`${className} min-h-[200px] bg-muted/60 flex flex-col items-center justify-center gap-2 px-6 text-center`}>
        <span className="text-sm font-bold text-foreground/70" style={MONT}>
          {project.name}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {proxying ? "Loading preview..." : "Preview unavailable"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={candidates[pos]}
      alt={`${project.name} preview`}
      loading="lazy"
      decoding="async"
      onError={onImgError}
      className={className}
    />
  );
}