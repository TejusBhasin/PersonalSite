import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Printer, TriangleAlert } from "lucide-react";
import { getProject } from "@/lib/scad/api";
import { compileOpenScad } from "@/lib/scad/openscad";
import { buildExport, downloadBlob } from "@/lib/scad/exportMesh";
import { formatBytes } from "@/lib/scad/format";
import {
  DEFAULT_SLICE_OPTIONS,
  gcodeSummary,
  mergeSliceOptions,
  sliceStl,
} from "@/lib/scad/slicer";
import ScadSliceOptions from "@/components/scadman/ScadSliceOptions";

const STAGE_LABEL = {
  engine: "Loading the slicing engine (about 4 MB, once per session)",
  parse: "Reading the mesh",
  slice: "Slicing layers",
  prepare: "Routing toolpaths",
  export: "Writing G-code",
};

const PREVIEW_LINES = 80;

function fileBase(title) {
  return (
    String(title || "model")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "model"
  );
}

export default function ScadSlice() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [options, setOptions] = useState(DEFAULT_SLICE_OPTIONS);
  const [stage, setStage] = useState("");
  const [gcode, setGcode] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    getProject(projectId)
      .then((row) => {
        if (cancelled) return;
        if (!row) {
          setState("missing");
          return;
        }
        setProject(row);
        if (row.print_settings) {
          try {
            setOptions(mergeSliceOptions(JSON.parse(row.print_settings)));
          } catch {
            setOptions(DEFAULT_SLICE_OPTIONS);
          }
        }
        setState("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "Could not load this project.");
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const [compiled, setCompiled] = useState(null);
  const [compiling, setCompiling] = useState(false);

  useEffect(() => {
    if (!project?.source_code) return undefined;
    let alive = true;
    setCompiling(true);
    compileOpenScad(project.source_code)
      .then((result) => {
        if (alive) setCompiled(result);
      })
      .catch(() => {
        if (alive) setCompiled(null);
      })
      .finally(() => {
        if (alive) setCompiling(false);
      });
    return () => {
      alive = false;
    };
  }, [project]);

  useEffect(() => {
    if (state !== "missing") return undefined;
    const meta = document.createElement("meta");
    meta.name = "prerender-status-code";
    meta.content = "404";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [state]);

  const busy = Boolean(stage);

  const runSlice = async () => {
    if (!compiled?.geoms?.length) {
      setNotice("This project has no compiled geometry to slice.");
      return;
    }
    setNotice("");
    setGcode("");
    setStage("engine");
    try {
      const { blob } = buildExport(compiled.geoms, "stl-ascii", project.title);
      const stl = await blob.text();
      const result = await sliceStl({ stl, options, onStage: setStage });
      setGcode(result);
      const summary = gcodeSummary(result);
      setNotice(`G-code ready · ${formatBytes(summary.bytes)} · ${summary.lines} lines`);
    } catch (e) {
      setNotice(e.message || "Slicing failed.");
    } finally {
      setStage("");
    }
  };

  const downloadGcode = () => {
    downloadBlob(new Blob([gcode], { type: "text/plain" }), `${fileBase(project.title)}.gcode`);
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

  const backTo = project.slug ? `/scadman/library/${project.slug}` : `/scadman/editor/${project.id}`;
  const summary = gcode ? gcodeSummary(gcode) : null;
  const preview = gcode ? gcode.split("\n").slice(0, PREVIEW_LINES).join("\n") : "";

  return (
    <div className="scad-wrap">
      <Link to={backTo} className="scad-btn scad-btn-ghost scad-btn-sm -ml-2 mb-3">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to the model
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="scad-eyebrow">Slice to G-code</p>
          <h1 className="scad-h1 mt-2 text-[26px]">{project.title}</h1>
          <p className="scad-body mt-2 max-w-[70ch]">
            The mesh compiles in this page, then the slicing engine turns it into printer G-code on
            your machine. Nothing is uploaded.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="scad-chip">{compiled?.stats?.triangles || 0} triangles</span>
          <span className="scad-chip">
            {compiled?.stats?.sizeMm
              ? `${compiled.stats.sizeMm.map((n) => n.toFixed(1)).join(" × ")} mm`
              : "no bounds"}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[320px_1fr]">
        <div className="scad-panel h-fit">
          <ScadSliceOptions options={options} onChange={setOptions} disabled={busy} />
        </div>

        <div className="space-y-3">
          <div className="scad-panel p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={runSlice}
                disabled={busy || !compiled?.geoms?.length}
                className="scad-btn scad-btn-primary"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                {busy ? "Slicing…" : gcode ? "Slice again" : "Slice model"}
              </button>
              <button type="button" onClick={downloadGcode} disabled={!gcode} className="scad-btn">
                <Download className="h-3.5 w-3.5" />
                Download .gcode
              </button>
              {busy && (
                <span className="text-[11px] text-[color:var(--scad-muted)]">{STAGE_LABEL[stage] || "Working"}</span>
              )}
            </div>

            {notice && (
              <p className="mt-2 text-[11px] font-semibold" style={{ color: "var(--scad-accent)" }}>
                {notice}
              </p>
            )}

            {compiling && (
              <p className="mt-2 text-[11px] text-[color:var(--scad-muted)]">
                Compiling the model with OpenSCAD…
              </p>
            )}

            {!compiling && !compiled?.geoms?.length && (
              <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed" style={{ color: "#ecc178" }}>
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This source did not produce any solid geometry, so there is nothing to slice. Open it in
                the editor and check the diagnostics.
              </p>
            )}
          </div>

          <div className="scad-panel overflow-hidden">
            <div
              className="flex items-center justify-between border-b px-3 py-2"
              style={{ borderColor: "var(--scad-line)" }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.14em]">G-code</span>
              <span className="text-[10px] text-[color:var(--scad-dim)]">
                {summary ? `${summary.lines} lines · ${formatBytes(summary.bytes)}` : "not sliced yet"}
              </span>
            </div>
            {gcode ? (
              <pre className="scad-code max-h-[440px] overflow-auto rounded-none border-0 text-[10.5px]">
                {preview}
                {summary.lines > PREVIEW_LINES ? `\n… ${summary.lines - PREVIEW_LINES} more lines in the download` : ""}
              </pre>
            ) : (
              <p className="p-3 text-[11.5px] leading-relaxed text-[color:var(--scad-muted)]">
                Pick your printer and print settings, then slice. The G-code appears here and downloads as a
                .gcode file ready for the printer.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-[10.5px] leading-relaxed text-[color:var(--scad-dim)]">
        Slicing by Kiri:Moto (MIT), running locally in this browser. Start and end G-code come from the
        selected machine profile, so check the first lines match your printer before you print.
      </p>
    </div>
  );
}