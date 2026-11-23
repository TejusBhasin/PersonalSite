import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Code2, Compass, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { listMyProjects, listPublicProjects } from "@/lib/scad/api";
import ScadProjectCard from "@/components/scadman/ScadProjectCard";
import ScadThumb from "@/components/scadman/ScadThumb";
import { timeAgo } from "@/lib/scad/format";

const QUICK = [
  {
    to: "/scadman/create",
    icon: Sparkles,
    title: "Create with AI",
    body: "Describe a part and review the OpenSCAD it produces.",
  },
  {
    to: "/scadman/create?mode=code",
    icon: Code2,
    title: "Open code editor",
    body: "Start from a template or an empty file and write it yourself.",
  },
  {
    to: "/scadman/library",
    icon: Compass,
    title: "Explore community",
    body: "Browse published models, sources and parameters.",
  },
];

export default function ScadHome() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, mine: [], community: [], error: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [mine, community] = await Promise.all([listMyProjects(8), listPublicProjects(6)]);
        if (alive) setState({ loading: false, mine, community, error: null });
      } catch (e) {
        if (alive) setState({ loading: false, mine: [], community: [], error: e.message });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const { mine, community, loading, error } = state;
  const resume = mine[0];
  const recent = mine.slice(0, 4);
  const published = mine.filter((p) => p.status === "published").slice(0, 3);
  const name = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "maker";

  return (
    <div className="scad-wrap">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="scad-eyebrow">Workspace</p>
          <h1 className="scad-h1 mt-2 text-[28px]">Welcome back, {name}</h1>
          <p className="scad-body mt-2 max-w-[62ch]">
            Everything starts as a project: source code, parameters, versions. Describe a model,
            then keep the geometry parametric so anyone can adjust it.
          </p>
        </div>
        <Link to="/scadman/create" className="scad-btn scad-btn-primary h-9 px-4">
          <Plus className="h-3.5 w-3.5" />
          New project
        </Link>
      </div>

      {error && (
        <p className="mt-4 text-[11.5px]" style={{ color: "var(--scad-err)" }}>
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {QUICK.map(({ to, icon: Icon, title, body }) => (
          <Link key={to} to={to} className="scad-card scad-card-hover group">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" style={{ color: "var(--scad-accent)" }} />
              <h3 className="scad-h3">{title}</h3>
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-[color:var(--scad-dim)] transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="scad-body mt-2 text-[11.5px]">{body}</p>
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2e3846] border-t-[#e9b14c]" />
        </div>
      ) : (
        <>
          {resume && (
            <section className="mt-10">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="scad-eyebrow">Continue creating</p>
                  <h2 className="scad-h2 mt-1.5">{resume.title}</h2>
                </div>
                <Link to={`/scadman/editor/${resume.id}`} className="scad-btn scad-btn-primary">
                  Resume
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <Link
                to={`/scadman/editor/${resume.id}`}
                className="scad-panel mt-3 flex flex-col gap-4 p-3 transition-colors hover:bg-[color:var(--scad-panel-2)] sm:flex-row sm:items-center"
              >
                <ScadThumb seed={resume.slug || resume.id} label={resume.title} className="h-[92px] w-full rounded sm:w-[150px]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">
                    {resume.description || "No description yet."}
                  </p>
                  <p className="mt-1.5 text-[10.5px] uppercase tracking-[0.1em] text-[color:var(--scad-dim)]">
                    last edited {timeAgo(resume.updated_date)} · {resume.visibility} · {resume.status}
                  </p>
                </div>
              </Link>
            </section>
          )}

          <section className="mt-10">
            <div className="flex items-end justify-between gap-3">
              <h2 className="scad-h2">Recent projects</h2>
              <Link to="/scadman/projects" className="scad-btn scad-btn-ghost scad-btn-sm">
                All projects
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="scad-panel mt-3 p-8 text-center">
                <p className="text-[12px] font-semibold">No projects yet</p>
                <p className="scad-body mx-auto mt-1.5 max-w-[46ch] text-[11.5px]">
                  Create your first model: describe it in a sentence, or start from an empty file and
                  write OpenSCAD directly.
                </p>
                <Link to="/scadman/create" className="scad-btn scad-btn-primary mt-4">
                  <Plus className="h-3.5 w-3.5" />
                  Start a project
                </Link>
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {recent.map((project) => (
                  <ScadProjectCard
                    key={project.id}
                    project={project}
                    href={`/scadman/editor/${project.id}`}
                    actions={
                      <>
                        <Link to={`/scadman/editor/${project.id}`} className="scad-btn scad-btn-sm flex-1">
                          Open
                        </Link>
                        <Link to={`/scadman/projects`} className="scad-btn scad-btn-ghost scad-btn-sm">
                          Manage
                        </Link>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {published.length > 0 && (
            <section className="mt-10">
              <h2 className="scad-h2">Recently published</h2>
              <div className="scad-panel mt-3 divide-y" style={{ borderColor: "var(--scad-line)" }}>
                {published.map((project) => (
                  <div key={project.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{project.title}</span>
                    <span className="scad-chip scad-chip-ok">public</span>
                    <span className="text-[10.5px] text-[color:var(--scad-dim)]">
                      {project.view_count || 0} views · {project.favorite_count || 0} favourites
                    </span>
                    <Link to={`/scadman/library/${project.slug}`} className="scad-btn scad-btn-sm">
                      View page
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="scad-h2">From the community</h2>
                <p className="scad-body mt-1 text-[11.5px]">
                  Published models you can open, customise and remix.
                </p>
              </div>
              <Link to="/scadman/library" className="scad-btn scad-btn-ghost scad-btn-sm">
                Explore library
              </Link>
            </div>
            {community.length === 0 ? (
              <p className="scad-body mt-3 text-[11.5px]">Nothing published yet.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {community.map((project) => (
                  <ScadProjectCard key={project.id} project={project} showOwner />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}