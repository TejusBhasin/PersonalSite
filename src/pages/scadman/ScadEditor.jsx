import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Code2,
  Columns2,
  Download,
  Eye,
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
  setParameterValue,
  snapshotVersion,
} from "@/lib/scad/api";
import { compileScad } from "@/lib/scad/engine";
import { EXPORT_FORMATS, buildExport, downloadBlob } from "@/lib/scad/exportMesh";
import useScadProfile from "@/hooks/useScadProfile";
import ScadAiPanel from "@/components/scadman/ScadAiPanel";
import ScadCodeEditor from "@/components/scadman/ScadCodeEditor";
import ScadViewport from "@/components/scadman/ScadViewport";
import ScadParamPanel from "@/components/scadman/ScadParamPanel";
import ScadPrintPanel from "@/components/scadman/ScadPrintPanel";
import { applyParamToSource, extractVariables, formatBytes, timeAgo } from "@/lib/scad/format";

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
  const [params, setParams] = useState([]);
  const [versions, setVersions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [knowledge, setKnowledge] = useState(null);

  const [aiBusy, setAiBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const [lastPrompt, setLastPrompt] = useState("");
  const [compile, setCompile] = useState({ loading: false, result: null, error: "" });
  const [saveState, setSaveState] = useState("saved");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState("split");
  const [tab, setTab] = useState("params");
  const [pane, setPane] = useState("code");
  const [wide, setWide] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState("");

  const editorRef = useRef(null);
  const paramsRef = useRef([]);
  const autoSent = useRef(false);

  paramsRef.current = params;

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
        setParams(prm);
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
    setCompile((current) => ({ ...current, loading: true, error: "" }));
    const timer = setTimeout(() => {
      try {
        setCompile({ loading: false, result: compileScad(code), error: "" });
      } catch (e) {
        setCompile({ loading: false, result: null, error: e.message });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [code]);

  const dirty = code !== savedCode;

  const notify = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }, []);

  const persist = useCallback(
    async (nextCode, description) => {
      if (!project) return;
      setSaveState("saving");
      try {
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
    [project, notify]
  );

  useEffect(() => {
    if (!dirty || !project) return;
    if (profile && profile.autosave === false) return;
    const timer = setTimeout(() => persist(code, "Autosave"), 2000);
    return () => clearTimeout(timer);
  }, [code, dirty, project, profile, persist]);

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
      setPending(null);
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
        setPending({ ...data, prompt: text });
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
      } catch (e) {
        notify(e.message || "The assistant could not respond.");
        setMessages((list) => list.filter((m) => m.id !== localId));
      } finally {
        setAiBusy(false);
      }
    },
    [aiBusy, code, params, compile.result, messages, conversationId, projectId, notify]
  );

  useEffect(() => {
    const initial = location.state?.prompt;
    if (initial && state === "ready" && !autoSent.current) {
      autoSent.current = true;
      runAi(initial);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, state, runAi, navigate]);

  const applyPending = async () => {
    if (!pending || !project) return;
    const nextCode = pending.code;
    setCode(nextCode);
    let nextParams = paramsRef.current;
    if (pending.parameters?.length) {
      try {
        const created = await replaceParameters(
          project.id,
          pending.parameters.map((p, index) => ({
            ...p,
            is_exposed: true,
            public: project.status === "published",
            sort_order: index,
          }))
        );
        nextParams = Array.isArray(created) ? created : [];
        setParams(nextParams);
      } catch (e) {
        notify(e.message || "Could not store the parameters.");
      }
    }
    setPending(null);
    await persist(nextCode, `AI: ${pending.title || pending.prompt}`.slice(0, 120));
    notify("Applied. The editor now holds the new source.");
  };

  const changeParam = async (param, value) => {
    const nextCode = applyParamToSource(code, param.name, value);
    setCode(nextCode);
    setParams((list) =>
      list.map((p) => (p.id === param.id ? { ...p, default_value: String(value) } : p))
    );
    if (param.id) await setParameterValue(param, value).catch(() => null);
  };

  const scanParameters = async () => {
    const found = extractVariables(code);
    if (found.length === 0) {
      notify("No top-level numeric variables found at the start of a line.");
      return;
    }
    try {
      const created = await replaceParameters(project.id, found);
      setParams(Array.isArray(created) ? created : []);
      notify(`${found.length} parameters picked up from the source.`);
    } catch (e) {
      notify(e.message || "Could not scan the source.");
    }
  };

  const publish = async () => {
    try {
      await publishProject(project, params);
      const refreshed = await getProject(project.id);
      setProject(refreshed);
      const prm = await listParameters(project.id);
      setParams(prm);
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

  const leave = () => {
    if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
    navigate("/scadman/projects");
  };

  const exportAs = async (format) => {
    const geoms = compile.result?.geoms || [];
    if (!geoms.length) {
      notify("Nothing to export yet — the model has not compiled.");
      return;
    }
    setExporting(format);
    try {
      const { blob, filename, format: chosen } = buildExport(geoms, format, project.title);
      downloadBlob(blob, filename);
      notify(`${filename} · ${formatBytes(blob.size)}`);
      base44.entities.ScadExport.create({
        project_id: project.id,
        format: chosen.id,
        file_size: blob.size,
        triangles: compile.result?.stats?.triangles || 0,
        engine: compile.result?.engine || "jscad-csg",
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

  const aiPanel = (
    <ScadAiPanel
      messages={messages}
      pending={pending}
      busy={aiBusy}
      knowledge={knowledge}
      onSend={runAi}
      onApply={applyPending}
      onReject={() => setPending(null)}
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
                Changes rewrite the matching assignment in the source, then recompile.
              </p>
            </div>
          </>
        )}
        {tab === "print" && (
          <ScadPrintPanel profile={profile} sizeMm={compile.result?.stats?.sizeMm} />
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
          onClick={() => persist(code, "Manual save")}
          className="scad-btn scad-btn-sm"
          title="Save and snapshot a version"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((open) => !open)}
            disabled={!compile.result?.geoms?.length || Boolean(exporting)}
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
                  <ScadCodeEditor
                    ref={editorRef}
                    value={code}
                    onChange={setCode}
                    fontSize={profile?.editor_font_size || 12}
                  />
                </div>
              )}
              {view !== "code" && (
                <div className="min-w-0 flex-1">
                  <ScadViewport result={compile.result} loading={compile.loading} />
                </div>
              )}
            </div>
            <DiagnosticsBar errors={errors} warnings={warnings} error={compile.error} stats={compile.result?.stats} />
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
              <ScadCodeEditor
                ref={editorRef}
                value={code}
                onChange={setCode}
                fontSize={profile?.editor_font_size || 12}
              />
            )}
            {pane === "preview" && <ScadViewport result={compile.result} loading={compile.loading} />}
            {pane === "params" && paramsPanel}
          </div>
          <DiagnosticsBar errors={errors} warnings={warnings} error={compile.error} stats={compile.result?.stats} />
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

function DiagnosticsBar({ errors, warnings, error, stats }) {
  const [open, setOpen] = useState(false);
  const problem = errors[0] || null;

  return (
    <div
      className="shrink-0 border-t px-3 py-1.5"
      style={{ borderColor: "var(--scad-line)", background: "var(--scad-panel)" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--scad-dim)]">
          built-in subset engine
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
          {problem ? `Line ${problem.line || "?"}: ${problem.message}` : error || "Booleans are solved by the CSG kernel. Unsupported features are listed here."}
        </span>
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