import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Copy, Heart, Pencil, Printer, Share2, TriangleAlert } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { getProjectBySlug, listParameters, projectAction } from "@/lib/scad/api";
import { compileOpenScad } from "@/lib/scad/openscad";
import { detectParameters, mergeParameters } from "@/lib/scad/params";
import { buildExport, downloadBlob } from "@/lib/scad/exportMesh";
import ScadViewport from "@/components/scadman/ScadViewport";
import ScadParamPanel from "@/components/scadman/ScadParamPanel";
import ScadCodeEditor from "@/components/scadman/ScadCodeEditor";
import { LICENSE_SHORT, applyParamToSource, canRemix, categoryLabel, formatBytes, formatDate } from "@/lib/scad/format";

export default function ScadModel() {
  const { slug } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [project, setProject] = useState(null);
  const [params, setParams] = useState([]);
  const [code, setCode] = useState("");
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [compile, setCompile] = useState({ loading: false, result: null });
  const [favorited, setFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [showSource, setShowSource] = useState(false);
  const [exporting, setExporting] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const found = await getProjectBySlug(slug);
        if (!alive) return;
        if (!found) {
          setState("missing");
          return;
        }
        setProject(found);
        setCode(found.source_code || "");
        setFavoriteCount(found.favorite_count || 0);
        const prm = await listParameters(found.id);
        if (!alive) return;
        setParams(prm);
        setState("ready");
        if (isAuthenticated) {
          const favs = await base44.entities.ScadFavorite.filter({ project_id: found.id });
          const rows = Array.isArray(favs) ? favs : favs?.items || [];
          if (alive) setFavorited(rows.length > 0);
          projectAction("view", found.id).catch(() => null);
        }
      } catch (e) {
        if (alive) {
          setError(e.message || "Could not load this model.");
          setState("error");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug, isAuthenticated]);

  useEffect(() => {
    if (!code.trim()) return;
    let alive = true;
    setCompile((c) => ({ ...c, loading: true }));
    const timer = setTimeout(async () => {
      try {
        const result = await compileOpenScad(code);
        if (alive) setCompile({ loading: false, result });
      } catch {
        if (alive) setCompile({ loading: false, result: null });
      }
    }, 350);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [code]);

  const changeParam = (param, value) => {
    setCode((current) => applyParamToSource(current, param.name, value));
    setParams((list) =>
      list.map((p) => (p.id === param.id ? { ...p, default_value: String(value) } : p))
    );
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      setNotice("Sign in to save models.");
      return;
    }
    try {
      const data = await projectAction("favorite", project.id);
      setFavorited(data.favorited);
      setFavoriteCount(data.favorite_count);
    } catch (e) {
      setNotice(e.message);
    }
  };

  const remix = async () => {
    if (!isAuthenticated) {
      setNotice("Sign in to remix this model.");
      return;
    }
    try {
      const data = await projectAction("remix", project.id);
      window.location.assign(`/scadman/editor/${data.project.id}`);
    } catch (e) {
      setNotice(e.message);
    }
  };

  const download = (format) => {
    const geoms = compile.result?.geoms || [];
    if (!geoms.length) {
      setNotice("Nothing has compiled yet.");
      return;
    }
    setExporting(format);
    try {
      const { blob, filename } = buildExport(geoms, format, project.title);
      downloadBlob(blob, filename);
      setNotice(`${filename} · ${formatBytes(blob.size)}`);
    } catch (e) {
      setNotice(e.message || "Export failed.");
    } finally {
      setExporting("");
    }
  };

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(project.source_code || "");
      setNotice("Source copied.");
    } catch {
      setNotice("Could not copy automatically. Select the code and copy it.");
    }
  };

  if (state === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2e3846] border-t-[#e9b14c]" />
      </div>
    );
  }

  if (state === "missing" || state === "error") {
    return (
      <div className="scad-wrap max-w-[640px] text-center">
        <h1 className="scad-h2 mt-10">Model not available</h1>
        <p className="scad-body mt-2">
          {state === "error"
            ? error
            : "This link does not point to a published or unlisted model. Private projects are only visible to their owner."}
        </p>
        <Link to="/scadman/library" className="scad-btn mt-5">
          Back to the library
        </Link>
      </div>
    );
  }

  const exposed = mergeParameters(detectParameters(code), params).filter((p) => p.is_exposed !== false);

  return (
    <div className="scad-wrap">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="scad-eyebrow">
            {categoryLabel(project.category)} · {LICENSE_SHORT[project.license]}
          </p>
          <h1 className="scad-h1 mt-2 text-[26px]">{project.title}</h1>
          <p className="scad-body mt-2 max-w-[70ch]">{project.description || "No description."}</p>
          <p className="mt-2 text-[10.5px] uppercase tracking-[0.12em] text-[color:var(--scad-dim)]">
            by {project.creator_name || "sample content"} · published {formatDate(project.published_at || project.created_date)} ·{" "}
            {project.view_count || 0} views · {favoriteCount} favourites
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={toggleFavorite} className="scad-btn">
            <Heart className="h-3.5 w-3.5" style={{ color: favorited ? "var(--scad-accent)" : undefined }} />
            {favorited ? "Saved" : "Favourite"}
          </button>
          {project.created_by_id && project.created_by_id === user?.id && (
            <Link to={`/scadman/editor/${project.id}`} className="scad-btn">
              <Pencil className="h-3.5 w-3.5" />
              Open in editor
            </Link>
          )}
          <button
            type="button"
            onClick={remix}
            disabled={!canRemix(project.license)}
            title={canRemix(project.license) ? "Create your own copy" : "This licence does not allow remixing"}
            className="scad-btn"
          >
            <Copy className="h-3.5 w-3.5" />
            Remix
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setNotice("Link copied.");
            }}
            className="scad-btn scad-btn-sm"
            title="Copy link"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {project.original_project_id && (
        <p className="mt-3 text-[11px] text-[color:var(--scad-muted)]">
          Remixed from <span className="font-semibold">{project.original_title || "another model"}</span>
          {project.original_author ? ` by ${project.original_author}` : ""}.
        </p>
      )}

      {notice && (
        <p className="mt-3 text-[11.5px] font-semibold" style={{ color: "var(--scad-accent)" }}>
          {notice}
        </p>
      )}

      <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="scad-panel h-[420px] overflow-hidden">
          <ScadViewport
            result={compile.result}
            loading={compile.loading}
            emptyHint="OpenSCAD produced no geometry for this source."
          />
        </div>

        <div className="scad-panel">
          <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: "var(--scad-line)" }}>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Customise</span>
            <span className="scad-chip">{exposed.length} params</span>
          </div>
          <ScadParamPanel
            params={exposed}
            onChange={changeParam}
            emptyHint="This source declares no top-level parameters."
          />
          {compile.result?.diagnostics?.length > 0 && (
            <div className="border-t px-3 py-2" style={{ borderColor: "var(--scad-line)" }}>
              {compile.result.diagnostics.slice(0, 3).map((d) => (
                <p
                  key={d.message}
                  className="flex gap-1.5 text-[10.5px] leading-relaxed"
                  style={{ color: d.severity === "error" ? "var(--scad-err)" : "#ecc178" }}
                >
                  <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                  {d.message}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => setShowSource((v) => !v)} className="scad-btn">
          {showSource ? "Hide source" : "View source code"}
        </button>
        <button type="button" onClick={copySource} className="scad-btn">
          <Copy className="h-3.5 w-3.5" />
          Copy code
        </button>
        <button
          type="button"
          onClick={() => download("stl-binary")}
          disabled={!compile.result?.geoms?.length || Boolean(exporting)}
          className="scad-btn"
          title="Download a binary STL of the current geometry"
        >
          Download STL
        </button>
        <button
          type="button"
          onClick={() => download("3mf")}
          disabled={!compile.result?.geoms?.length || Boolean(exporting)}
          className="scad-btn"
          title="Download a 3MF package of the current geometry"
        >
          Download 3MF
        </button>
        <Link
          to={`/scadman/slice/${project.id}`}
          className="scad-btn scad-btn-primary"
          title="Slice this model to G-code in your browser"
        >
          <Printer className="h-3.5 w-3.5" />
          Slice to G-code
        </Link>
        <span className="text-[10.5px] text-[color:var(--scad-dim)]">
          {compile.result?.stats?.triangles
            ? `${compile.result.stats.triangles} triangles ready to export`
            : "Exports unlock once the model compiles"}
        </span>
      </div>

      {showSource && (
        <div className="scad-panel mt-3 overflow-hidden" style={{ height: 380 }}>
          <ScadCodeEditor value={project.source_code || ""} onChange={() => {}} readOnly minHeight={380} />
        </div>
      )}

      {project.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span key={tag} className="scad-chip">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {project.created_by_id && (
        <div className="scad-panel mt-5 flex items-center gap-3 p-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
            style={{ background: "var(--scad-panel-3)", color: "var(--scad-accent)" }}
          >
            {(project.creator_name || "S")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold">{project.creator_name || "Sample creator"}</p>
            <p className="text-[10.5px] text-[color:var(--scad-dim)]">creator</p>
          </div>
          <span className="scad-chip">{LICENSE_SHORT[project.license]}</span>
        </div>
      )}

      <p className="mt-6 flex items-start gap-2 text-[10.5px] leading-relaxed text-[color:var(--scad-dim)]">
        <Pencil className="mt-0.5 h-3 w-3 shrink-0" />
        Geometry is compiled by the real OpenSCAD kernel (openscad-wasm) in your browser, so every
        boolean, hull and extrusion is exact and the mesh exports cleanly. Nothing is uploaded.
      </p>
    </div>
  );
}