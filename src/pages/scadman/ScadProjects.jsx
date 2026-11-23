import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Plus, Trash2, Upload, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  listMyProjects,
  listParameters,
  projectAction,
  publishProject,
  unpublishProject,
} from "@/lib/scad/api";
import ScadProjectCard from "@/components/scadman/ScadProjectCard";
import { VISIBILITY_LABEL } from "@/lib/scad/format";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "published", label: "Published" },
];

export default function ScadProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await listMyProjects(60));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const publish = async (project) => {
    setBusy(project.id);
    setNotice(null);
    try {
      const params = await listParameters(project.id);
      await publishProject(project, params);
      setNotice(`“${project.title}” is published and listed in the library.`);
      await load();
    } catch (e) {
      setNotice(e.message || "Could not publish this project.");
    } finally {
      setBusy(null);
    }
  };

  const unpublish = async (project) => {
    setBusy(project.id);
    setNotice(null);
    try {
      await unpublishProject(project);
      setNotice(`“${project.title}” is back to a private draft.`);
      await load();
    } catch (e) {
      setNotice(e.message || "Could not unpublish this project.");
    } finally {
      setBusy(null);
    }
  };

  const duplicate = async (project) => {
    setBusy(project.id);
    setNotice(null);
    try {
      const data = await projectAction("duplicate", project.id);
      setNotice(`Copied to “${data.project.title}”.`);
      await load();
    } catch (e) {
      setNotice(e.message || "Could not duplicate this project.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (project) => {
    const confirmed = window.confirm(
      `Delete “${project.title}”? The source, parameters and versions are removed permanently.`
    );
    if (!confirmed) return;
    setBusy(project.id);
    try {
      await base44.entities.ScadParameter.deleteMany({ project_id: project.id });
      await base44.entities.ScadProjectVersion.deleteMany({ project_id: project.id });
      await base44.entities.ScadProject.delete(project.id);
      setProjects((list) => list.filter((p) => p.id !== project.id));
      setNotice(`“${project.title}” deleted.`);
    } catch (e) {
      setNotice(e.message || "Could not delete this project.");
    } finally {
      setBusy(null);
    }
  };

  const changeVisibility = async (project, visibility) => {
    setBusy(project.id);
    try {
      await base44.entities.ScadProject.update(project.id, { visibility });
      setProjects((list) => list.map((p) => (p.id === project.id ? { ...p, visibility } : p)));
    } catch (e) {
      setNotice(e.message || "Could not change visibility.");
    } finally {
      setBusy(null);
    }
  };

  const visible = projects.filter((p) => (filter === "all" ? true : p.status === filter));

  return (
    <div className="scad-wrap">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="scad-eyebrow">Workspace</p>
          <h1 className="scad-h1 mt-2 text-[26px]">My projects</h1>
          <p className="scad-body mt-2">
            {projects.length} project{projects.length === 1 ? "" : "s"} · privacy is enforced on the
            server, not in the interface.
          </p>
        </div>
        <Link to="/scadman/create" className="scad-btn scad-btn-primary">
          <Plus className="h-3.5 w-3.5" />
          New project
        </Link>
      </div>

      <div className="mt-5 flex items-center gap-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`scad-btn scad-btn-sm${filter === item.id ? " scad-btn-primary" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {notice && (
        <p className="mt-3 text-[11.5px] font-semibold" style={{ color: "var(--scad-accent)" }}>
          {notice}
        </p>
      )}

      {loading ? (
        <div className="mt-10 flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2e3846] border-t-[#e9b14c]" />
        </div>
      ) : visible.length === 0 ? (
        <div className="scad-panel mt-6 p-10 text-center">
          <p className="text-[12.5px] font-semibold">
            {projects.length === 0 ? "No projects yet" : "Nothing in this filter"}
          </p>
          <p className="scad-body mx-auto mt-2 max-w-[48ch] text-[11.5px]">
            Projects hold the OpenSCAD source, the exposed parameters and every saved version.
          </p>
          <Link to="/scadman/create" className="scad-btn scad-btn-primary mt-4">
            <Plus className="h-3.5 w-3.5" />
            Create a project
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <ScadProjectCard
              key={project.id}
              project={project}
              href={`/scadman/editor/${project.id}`}
              footer={
                <select
                  value={project.visibility}
                  disabled={busy === project.id}
                  onChange={(e) => changeVisibility(project, e.target.value)}
                  className="scad-select text-[11px]"
                >
                  {Object.entries(VISIBILITY_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              }
              actions={
                <>
                  <Link to={`/scadman/editor/${project.id}`} className="scad-btn scad-btn-sm flex-1">
                    Open
                  </Link>
                  {project.status === "published" ? (
                    <>
                      <Link to={`/scadman/library/${project.slug}`} className="scad-btn scad-btn-sm" title="View public page">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => unpublish(project)}
                        disabled={busy === project.id}
                        className="scad-btn scad-btn-sm"
                        title="Unpublish"
                      >
                        Unpublish
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => publish(project)}
                      disabled={busy === project.id}
                      className="scad-btn scad-btn-sm"
                      title="Publish to the library"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Publish
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => duplicate(project)}
                    disabled={busy === project.id}
                    className="scad-btn scad-btn-sm"
                    title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(project)}
                    disabled={busy === project.id}
                    className="scad-btn scad-btn-sm scad-btn-danger"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}