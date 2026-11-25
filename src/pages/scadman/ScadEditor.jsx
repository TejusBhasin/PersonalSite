import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Code2,
  Columns2,
  Download,
  Eye,
  FolderOpen,
  History,
  Printer,
  Redo2,
  Save,
  Sliders,
  TriangleAlert,
  Undo2,
  Upload,
  ExternalLink,
  Wand2,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  askAi,
  getProject,
  listParameters,
  listVersions,
  publishProject,
  replaceParameters,
  saveProject,
  snapshotVersion,
} from "@/lib/scad/api";
import { compileOpenScad } from "@/lib/scad/openscad";
import { detectParameters, mergeParameters, parametersSignature } from "@/lib/scad/params";
import { EXPORT_FORMATS, buildExport, downloadBlob } from "@/lib/scad/exportMesh";
import useScadProfile from "@/hooks/useScadProfile";
import ScadAiPanel from "@/components/scadman/ScadAiPanel";
import ScadMonacoEditor from "@/components/scadman/ScadMonacoEditor";
import ScadViewport from "@/components/scadman/ScadViewport";
import ScadParamPanel from "@/components/scadman/ScadParamPanel";
import ScadPrintPanel from "@/components/scadman/ScadPrintPanel";
import { applyParamToSource, formatBytes, timeAgo } from "@/lib/scad/format";

export default function ScadEditor() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useScadProfile();

  const [project, setProject] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [savedCode, setSavedCode] = useState("");
  const [storedParams, setStoredParams] = useState([]);
  const [versions, setVersions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [knowledge, setKnowledge] = useState(null);

  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiStage, setAiStage] = useState(-1);
  const [aiElapsed, setAiElapsed] = useState(0);
  const [applied, setApplied] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  const [compile, setCompile] = useState({ loading: false, result: null, error: "" });
  const [compileAttempt, setCompileAttempt] = useState(0);
  const [compileTick, setCompileTick] = useState(0);
  const [saveState, setSaveState] = useState("saved");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState("split");
  const [tab, setTab] = useState("params");
  const [pane, setPane] = useState("code");
  const [wide, setWide] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState("");

  const editorRef = useRef(null);
  const fileRef = useRef(null);
  const runningRef = useRef(false);
  const pendingRef = useRef(false);
  const paramsRef = useRef([]);
  const storedRef = useRef([]);
  const storedSignature = useRef("");
  const autoSent = useRef(false);

  const params = useMemo(
    () => mergeParameters(detectParameters(code), storedParams),
    [code, storedParams]
  );

  paramsRef.current = params;
  storedRef.current = storedParams;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const found = await getProject(projectId);
        if (!alive) return;
        if (!found) {
          setState("missing");
          return;
        }
        setProject(found);
        setCode(found.source_code || "");
        setSavedCode(found.source_code || "");
        const [prm, vers, convs] = await Promise.all([
          listParameters(projectId),
          listVersions(projectId),
          base44.entities.ScadConversation.filter({ project_id: projectId }, { limit: 1 }),
        ]);
        if (!alive) return;
        setStoredParams(prm);
        storedSignature.current = parametersSignature(
          mergeParameters(detectParameters(found.source_code || ""), prm)
        );
        setVersions(vers);
        const convRows = Array.isArray(convs) ? convs : convs?.items || [];
        let conversation = convRows[0];
        if (!conversation) {
          conversation = await base44.entities.ScadConversation.create({
            project_id: projectId,
            title: found.title,
          });
        }
        if (!alive) return;
        setConversationId(conversation.id);
        const msgs = await base44.entities.ScadMessage.filter(
          { project_id: projectId },
          { sort: "created_date", limit: 40 }
        );
        if (!alive) return;
        setMessages(Array.isArray(msgs) ? msgs : msgs?.items || []);
        setState("ready");
      } catch (e) {
        if (alive) {
          setError(e.message || "Could not open this project.");
          setState("error");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!code.trim()) {
      setCompile({ loading: false, result: null, error: "" });
      return;
    }
    const timer = setTimeout(async () => {
      // One compile at a time: a model heavy enough to take a minute must not pile up a new
      // run on every keystroke. A change made mid-run is picked up as soon as it finishes.
      if (runningRef.current) {
        pendingRef.current = true;
        return;
      }
      runningRef.current = true;
      setCompile((current) => ({ ...current, loading: true, error: "" }));
      setCompileAttempt(1);
      try {
        const result = await compileOpenScad(code, {
          onStatus: ({ attempt }) => setCompileAttempt(attempt),
        });
        setCompile({ loading: false, result, error: "" });
      } catch (e) {
        setCompile({
          loading: false,
          result: null,
          error: e?.message || "The OpenSCAD compiler could not start.",
        });
      } finally {
        runningRef.current = false;
        setCompileAttempt(0);
        if (pendingRef.current) {
          pendingRef.current = false;
          setCompileTick((n) => n + 1);
        }
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [code, compileTick]);

  const dirty = code !== savedCode;

  const notify = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }, []);

  const syncParameters = useCallback(
    async (nextCode, ...hints) => {
      if (!project) return;
      const detected = mergeParameters(detectParameters(nextCode), ...hints, storedRef.current);
      const signature = parametersSignature(detected);
      if (signature === storedSignature.current) return;
      try {
        const created = await replaceParameters(
          project.id,
          detected.map((p) => ({
            ...p,
            is_exposed: p.is_exposed !== false,
            public: project.status === "published",
          }))
        );
        const rows = Array.isArray(created) ? created : [];
        setStoredParams(rows);
        storedRef.current = rows;
        storedSignature.current = signature;
      } catch (e) {
        notify(e.message || "Could not store the parameters.");
      }
    },
    [project, notify]
  );

  const persist = useCallback(
    async (nextCode, description, options = {}) => {
      if (!project) return;
      setSaveState("saving");
      try {
        if (options.syncParams) await syncParameters(nextCode, options.hints || []);
        await saveProject(project, nextCode);
        await snapshotVersion(project, nextCode, paramsRef.current, description);
        setSavedCode(nextCode);
        setSaveState("saved");
        const refreshed = await listVersions(project.id);
        setVersions(refreshed);
      } catch (e) {
        setSaveState("error");
        notify(e.message || "Could not save.");
      }
    },
    [project, notify, syncParameters]
  );

  useEffect(() => {
    if (!dirty || !project || streaming) return;
    if (profile && profile.autosave === false) return;
    const timer = setTimeout(() => persist(code, "Autosave"), 2000);
    return () => clearTimeout(timer);
  }, [code, dirty, project, profile, persist, streaming]);

  useEffect(() => {
    const handler = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const runAi = useCallback(
    async (text) => {
      if (!text.trim() || aiBusy) return;
      setAiBusy(true);
      setLastPrompt(text);
      setApplied(null);
      setAiError("");
      setAiStage(0);
      setAiElapsed(0);
      const startedAt = Date.now();
      const clock = window.setInterval(() => setAiElapsed((Date.now() - startedAt) / 1000), 200);
      const stage1 = window.setTimeout(() => setAiStage(1), 700);
      const stage2 = window.setTimeout(() => setAiStage(2), 2200);
      const localId = `local-${Date.now()}`;
      setMessages((list) => [...list, { id: localId, role: "user", content: text }]);
      try {
        if (conversationId) {
          await base44.entities.ScadMessage.create({
            conversation_id: conversationId,
            project_id: projectId,
            role: "user",
            content: text,
          }).catch(() => null);
        }
        const data = await askAi({
          prompt: text,
          code,
          parameters: params.map((p) => ({
            name: p.name,
            label: p.label,
            type: p.type,
            default_value: p.default_value,
            unit: p.unit,
          })),
          diagnostics: compile.result?.diagnostics || [],
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        });
        window.clearTimeout(stage1);
        window.clearTimeout(stage2);
        setAiStage(2);
        setKnowledge(data.knowledge);
        setMessages((list) => [
          ...list,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply,
            generated_code: data.code,
          },
        ]);
        if (conversationId) {
          await base44.entities.ScadMessage.create({
            conversation_id: conversationId,
            project_id: projectId,
            role: "assistant",
            content: data.reply,
            generated_code: data.code,
            meta: JSON.stringify({
              assumptions: data.assumptions || [],
              warnings: data.warnings || [],
              knowledge: data.knowledge?.used || [],
            }),
          }).catch(() => null);
        }

        const previous = code;
        const next = String(data.code || "");
        const summary = {
          reply: data.reply,
          title: data.title,
          assumptions: data.assumptions || [],
          warnings: data.warnings || [],
          previousCode: previous,
          unchanged: !next || next === previous,
        };

        if (summary.unchanged) {
          setApplied(summary);
          return;
        }

        // Write the new source into the editor a few characters at a time so the change
        // lands where you can watch it happen, then save once at the end.
        setStreaming(true);
        const total = next.length;
        const chunk = Math.max(6, Math.ceil(total / 70));
        await new Promise((resolve) => {
          let index = 0;
          const writer = window.setInterval(() => {
            index = Math.min(total, index + chunk);
            setCode(next.slice(0, index));
            if (index >= total) {
              window.clearInterval(writer);
              resolve();
            }
          }, 22);
        });
        setStreaming(false);
        setCode(next);
        setApplied(summary);
        setAiStage(3);
        await persist(next, `AI: ${data.title || text}`.slice(0, 120), {
          syncParams: true,
          hints: data.parameters || [],
        });
      } catch (e) {
        setAiError(e.message || "The assistant could not respond.");
      } finally {
        window.clearInterval(clock);
        window.clearTimeout(stage1);
        window.clearTimeout(stage2);
        setStreaming(false);
        setAiStage(-1);
        setAiBusy(false);
      }
    },
    [aiBusy, code, params, compile.result, messages, conversationId, projectId, persist]
  );

  useEffect(() => {
    const initial = location.state?.prompt;
    if (initial && state === "ready" && !autoSent.current) {
      autoSent.current = true;
      runAi(initial);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, state, runAi, navigate]);

  const revertChange = async () => {
    if (!applied || applied.unchanged) return;
    const back = applied.previousCode || "";
    setCode(back);
    setApplied(null);
    await persist(back, "Reverted the assistant change");
    notify("Reverted to the previous source.");
  };

  const changeParam = (param, value) => {
    setCode((current) => applyParamToSource(current, param.name, value));
  };

  const scanParameters = async () => {
    const found = detectParameters(code);
    if (found.length === 0) {
      notify("No top-level variables found. Declare them at the start of a line.");
      return;
    }
    storedSignature.current = "";
    await syncParameters(code);
    notify(`${found.length} parameters detected from the source.`);
  };

  const publish = async () => {
    try {
      await syncParameters(code);
      const prm = await listParameters(project.id);
      setStoredParams(prm);
      storedRef.current = prm;
      await publishProject(project, prm);
      const refreshed = await getProject(project.id);
      setProject(refreshed);
      notify("Published. The model page is live.");
    } catch (e) {
      notify(e.message || "Could not publish.");
    }
  };

  const restoreVersion = async (version) => {
    setCode(version.source_code);
    await persist(version.source_code, `Restored version ${version.version_number}`);
    notify(`Restored version ${version.version_number}.`);
  };

  const loadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    if (!text.trim()) {
      notify("That file is empty.");
      return;
    }
    setCode(text);
    await persist(text, `Uploaded ${file.name}`, { syncParams: true });
    notify(`${file.name} loaded into the editor.`);
  };

  const leave = () => {
    if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
    navigate("/scadman/projects");
  };

  const exportAs = async (format) => {
    const compiled = compile.result;
    if (!compiled?.ok) {
      notify("Nothing to export yet — the model has not compiled.");
      return;
    }
    setExporting(format);
    try {
      const { blob, filename, format: chosen } = buildExport(compiled, format, project.title);
      downloadBlob(blob, filename);
      notify(`${filename} · ${formatBytes(blob.size)}`);
      base44.entities.ScadExport.create({
        project_id: project.id,
        format: chosen.id,
        file_size: blob.size,
        triangles: compile.result?.stats?.triangles || 0,
        engine: compile.result?.engine || "openscad-wasm",
      }).catch(() => null);
    } catch (e) {
      notify(e.message || "Export failed.");
    } finally {
      setExporting("");
    }
  };

  if (state === "loading") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2e3846] border-t-[#e9b14c]" />
      </div>
    );
  }

  if (state === "missing" || state === "error") {
    return (
      <div className="scad-wrap max-w-[560px] text-center">
        <h1 className="scad-h2 mt-10">Project not available</h1>
        <p className="scad-body mt-2">
          {state === "error" ? error : "This project does not exist, or it belongs to another account."}
        </p>
        <Link to="/scadman/projects" className="scad-btn mt-5">
          Back to my projects
        </Link>
      </div>
    );
  }

  const diagnostics = compile.result?.diagnostics || [];
  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");

  const fixWithAi = () => {
    const lines = errors
      .slice(0, 6)
      .map((d) => `- ${d.line ? `line ${d.line}: ` : ""}${d.message}`)
      .join("\n");
    if (!wide) setPane("ai");
    runAi(
      `Fix the OpenSCAD compile errors in this model and return the complete corrected source, keeping the design intent.\n\nCompiler output:\n${lines}`
    );
  };

  const aiPanel = (
    <ScadAiPanel
      messages={messages}
      applied={applied}
      busy={aiBusy}
      stage={aiStage}
      elapsed={aiElapsed}
      error={aiError}
      knowledge={knowledge}
      onSend={runAi}
      onRevert={revertChange}
      onRetry={() => runAi(lastPrompt)}
    />
  );

  const paramsPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex border-b" style={{ borderColor: "var(--scad-line)" }}>
        {[
          ["params", "Parameters", Sliders],
          ["print", "Print", Printer],
          ["versions", "Versions", History],
        ].map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2 text-[10.5px] font-bold uppercase tracking-[0.1em] transition-colors ${
              tab === id ? "text-[color:var(--scad-text)]" : "text-[color:var(--scad-dim)]"
            }`}
            style={{ borderColor: tab === id ? "var(--scad-accent)" : "transparent" }}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "params" && (
          <>
            <ScadParamPanel params={params} onChange={changeParam} />
            <div className="border-t p-3" style={{ borderColor: "var(--scad-line)" }}>
              <button type="button" onClick={scanParameters} className="scad-btn scad-btn-sm w-full">
                Scan source for parameters
              </button>
              <p className="mt-1.5 text-[10px] leading-relaxed text-[color:var(--scad-dim)]">
                Detected from the source. Changing one rewrites that assignment and recompiles.
              </p>
            </div>
          </>
        )}
        {tab === "print" && (
          <ScadPrintPanel
            profile={profile}
            sizeMm={compile.result?.stats?.sizeMm}
            projectId={project?.id}
          />
        )}
        {tab === "versions" && (
          <div className="p-3">
            {versions.length === 0 ? (
              <p className="text-[11px] text-[color:var(--scad-dim)]">
                No versions yet. Each save stores a snapshot of the source.
              </p>
            ) : (
              <div className="space-y-1.5">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="rounded-md border px-2.5 py-2"
                    style={{ borderColor: "var(--scad-line)", background: "var(--scad-panel-2)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold">v{version.version_number}</span>
                      <span className="text-[9.5px] uppercase tracking-[0.1em] text-[color:var(--scad-dim)]">
                        {timeAgo(version.created_date)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[10.5px] text-[color:var(--scad-muted)]">
                      {version.change_description || "Save"}
                    </p>
                    <button
                      type="button"
                      onClick={() => restoreVersion(version)}
                      className="scad-btn scad-btn-sm mt-1.5 w-full"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="scad-workspace flex-col">
      <div
        className="flex flex-wrap items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: "var(--scad-line)", background: "var(--scad-panel)" }}
      >
        <button type="button" onClick={leave} className="scad-btn scad-btn-ghost scad-btn-sm" title="Back to projects">
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <input
          value={project.title}
          onChange={(e) => setProject((p) => ({ ...p, title: e.target.value }))}
          onBlur={async () => {
            await base44.entities.ScadProject.update(project.id, { title: project.title });
          }}
          className="w-[190px] rounded border border-transparent bg-transparent px-1.5 py-1 text-[12.5px] font-bold outline-none hover:border-[color:var(--scad-line)] focus:border-[color:var(--scad-line-2)]"
          aria-label="Project title"
        />
        <span className={`scad-chip ${saveState === "saved" ? "scad-chip-ok" : saveState === "error" ? "scad-chip-err" : "scad-chip-warn"}`}>
          {saveState === "saved" ? "saved" : saveState === "saving" ? "saving" : "save failed"}
        </span>
        {dirty && <span className="scad-chip scad-chip-warn">unsaved</span>}
        <span className="scad-chip">{project.visibility}</span>

        <div className="flex-1" />

        {notice && (
          <span className="hidden text-[10.5px] font-semibold sm:inline" style={{ color: "var(--scad-accent)" }}>
            {notice}
          </span>
        )}

        <div className="hidden items-center gap-0.5 rounded-md border p-0.5 sm:flex" style={{ borderColor: "var(--scad-line)" }}>
          {[
            ["code", Code2],
            ["split", Columns2],
            ["preview", Eye],
          ].map(([id, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              title={`${id} view`}
              className="rounded px-1.5 py-1"
              style={{
                background: view === id ? "var(--scad-panel-3)" : "transparent",
                color: view === id ? "var(--scad-text)" : "var(--scad-dim)",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <button type="button" onClick={() => editorRef.current?.undo()} className="scad-btn scad-btn-sm" title="Undo">
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => editorRef.current?.redo()} className="scad-btn scad-btn-sm" title="Redo">
          <Redo2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => persist(code, "Manual save", { syncParams: true })}
          className="scad-btn scad-btn-sm"
          title="Save and snapshot a version"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="scad-btn scad-btn-sm"
          title="Load a .scad file into the editor"
        >
          <FolderOpen className="h-3.5 w-3.5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".scad,.txt,text/plain"
          className="hidden"
          onChange={loadFile}
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((open) => !open)}
            disabled={!compile.result?.ok || Boolean(exporting)}
            className="scad-btn scad-btn-sm"
            title="Export STL / 3MF"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? "…" : ""}
          </button>
          {exportOpen && (
            <div
              className="absolute right-0 top-9 z-50 w-44 rounded-md border p-1"
              style={{ borderColor: "var(--scad-line-2)", background: "var(--scad-panel-2)" }}
            >
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.id}
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    exportAs(format.id);
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left text-[11px] font-semibold text-[color:var(--scad-muted)] hover:bg-[color:var(--scad-panel-3)] hover:text-[color:var(--scad-text)]"
                >
                  {format.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {project.status === "published" ? (
          <Link to={`/scadman/library/${project.slug}`} className="scad-btn scad-btn-sm">
            <ExternalLink className="h-3.5 w-3.5" />
            Model page
          </Link>
        ) : (
          <button type="button" onClick={publish} className="scad-btn scad-btn-primary scad-btn-sm">
            <Upload className="h-3.5 w-3.5" />
            Publish
          </button>
        )}
      </div>

      {wide ? (
        <div className="flex min-h-0 flex-1">
          <aside
            className="flex w-[310px] shrink-0 flex-col border-r"
            style={{ borderColor: "var(--scad-line)", background: "var(--scad-panel)" }}
          >
            {aiPanel}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1">
              {view !== "preview" && (
                <div className={`min-w-0 ${view === "split" ? "flex-1 border-r" : "flex-1"}`} style={{ borderColor: "var(--scad-line)" }}>
                  <ScadMonacoEditor
                    ref={editorRef}
                    value={code}
                    onChange={setCode}
                    fontSize={profile?.editor_font_size || 12}
                    tabSize={profile?.editor_tab_width || 2}
                  />
                </div>
              )}
              {view !== "code" && (
                <div className="min-w-0 flex-1">
                  <ScadViewport result={compile.result} loading={compile.loading} />
                </div>
              )}
            </div>
            <DiagnosticsBar
              errors={errors}
              warnings={warnings}
              error={compile.error}
              stats={compile.result?.stats}
              engineLabel={compile.result?.engineLabel}
              loading={compile.loading}
              attempt={compileAttempt}
              onFix={fixWithAi}
              fixing={aiBusy}
            />
          </div>

          <aside
            className="flex w-[320px] shrink-0 flex-col border-l"
            style={{ borderColor: "var(--scad-line)", background: "var(--scad-panel)" }}
          >
            {paramsPanel}
          </aside>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            {pane === "ai" && aiPanel}
            {pane === "code" && (
              <ScadMonacoEditor
                ref={editorRef}
                value={code}
                onChange={setCode}
                fontSize={profile?.editor_font_size || 12}
                tabSize={profile?.editor_tab_width || 2}
              />
            )}
            {pane === "preview" && <ScadViewport result={compile.result} loading={compile.loading} />}
            {pane === "params" && paramsPanel}
          </div>
          <DiagnosticsBar
              errors={errors}
              warnings={warnings}
              error={compile.error}
              stats={compile.result?.stats}
              engineLabel={compile.result?.engineLabel}
              loading={compile.loading}
              attempt={compileAttempt}
              onFix={fixWithAi}
              fixing={aiBusy}
            />
          <nav
            className="grid grid-cols-4 border-t"
            style={{ borderColor: "var(--scad-line)", background: "var(--scad-panel)" }}
          >
            {[
              ["ai", "Assistant", Wand2],
              ["code", "Code", Code2],
              ["preview", "Preview", Eye],
              ["params", "Params", Sliders],
            ].map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPane(id)}
                className="flex flex-col items-center gap-1 py-2 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                style={{ color: pane === id ? "var(--scad-accent)" : "var(--scad-dim)" }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

function DiagnosticsBar({ errors, warnings, error, stats, engineLabel, loading, attempt, onFix, fixing }) {
  const [open, setOpen] = useState(false);
  const problem = errors[0] || null;

  return (
    <div
      className="shrink-0 border-t px-3 py-1.5"
      style={{ borderColor: "var(--scad-line)", background: "var(--scad-panel)" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--scad-dim)]">
          {engineLabel || "OpenSCAD"}
        </span>
        {stats?.triangles > 0 && <span className="scad-chip">{stats.triangles} tris</span>}
        {errors.length > 0 ? (
          <span className="scad-chip scad-chip-err">{errors.length} error</span>
        ) : (
          <span className="scad-chip scad-chip-ok">no syntax errors</span>
        )}
        {warnings.length > 0 && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="scad-chip scad-chip-warn">
            <TriangleAlert className="h-2.5 w-2.5" />
            {warnings.length} note{warnings.length === 1 ? "" : "s"}
          </button>
        )}
        <span className="min-w-0 flex-1 truncate text-[10.5px]" style={{ color: problem ? "var(--scad-err)" : "var(--scad-dim)" }}>
          {problem
            ? `Line ${problem.line || "?"}: ${problem.message}`
            : error ||
              (loading
                ? attempt > 1
                  ? `Compiling with OpenSCAD, attempt ${attempt} of 3. A heavy model is retried rather than given up on.`
                  : "Compiling with OpenSCAD. The first run downloads the compiler once."
                : "Compiled by the real OpenSCAD kernel. Warnings appear here.")}
        </span>
        {errors.length > 0 && onFix && (
          <button
            type="button"
            onClick={onFix}
            disabled={fixing}
            className="scad-btn scad-btn-sm"
            title="Send these errors to the assistant and apply its fix"
          >
            <Wand2 className="h-3.5 w-3.5" />
            {fixing ? "Fixing…" : "Fix with AI"}
          </button>
        )}
      </div>
      {open && warnings.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {warnings.slice(0, 6).map((w) => (
            <li key={`${w.message}-${w.line}`} className="text-[10px] leading-relaxed" style={{ color: "#ecc178" }}>
              {w.line ? `Line ${w.line}: ` : ""}
              {w.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}