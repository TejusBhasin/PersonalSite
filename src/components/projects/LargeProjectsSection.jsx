import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, ArrowRight, Github } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const SkillBubble = ({ skill, onClick }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="inline-flex items-center justify-center border border-border bg-card/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] font-bold text-card-foreground/80 tracking-widest uppercase hover:bg-foreground hover:text-background hover:border-foreground hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer"
    style={MONT}
  >
    {skill}
  </button>
);

function ProjectCard({ project, index }) {
  const navigate = useNavigate();
  const openProject = () => navigate(`/project/${project.slug}`);
  const skills = project.skills || [];
  const host = (() => { try { return new URL(project.url).hostname.replace(/^www\./, ""); } catch { return project.url; } })();

  return (
    <div
      className="group bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl overflow-hidden hover:-translate-y-2 hover:shadow-xl hover:border-foreground/30 transition-all duration-400 flex flex-col"
      style={{ animation: `cardReveal 0.8s ease-out ${index * 0.1}s both` }}
    >
      {project.embed_url ? (
        <div className="relative block overflow-hidden bg-card">
          <iframe
            src={project.embed_url}
            title={`${project.name} presentation`}
            loading="lazy"
            allow="fullscreen"
            className="w-full aspect-[16/10]"
          />
        </div>
      ) : (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block overflow-hidden"
        >
          <img
            src={project.preview}
            alt={`${project.name} preview`}
            loading="lazy"
            decoding="async"
            className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300 flex items-center justify-center">
            <span
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 bg-background text-foreground text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full shadow-lg"
              style={MONT}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Project
            </span>
          </div>
        </a>
      )}

      <div className="p-6 flex flex-col flex-1 cursor-pointer" onClick={openProject}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-base font-bold text-foreground tracking-wide" style={MONT}>
            {project.name}
          </h3>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.name} on GitHub`}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
            <span
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
              style={MONT}
            >
              {host}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">{project.tagline}</p>

        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 3).map((skill) => (
            <SkillBubble key={skill} skill={skill} onClick={openProject} />
          ))}
          {skills.length > 3 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openProject();
              }}
              className="inline-flex items-center justify-center border border-foreground/30 px-4 py-1.5 rounded-full text-[10px] font-bold text-foreground/60 tracking-widest uppercase hover:bg-foreground hover:text-background hover:border-foreground hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer"
              style={MONT}
            >
              +{skills.length - 3} more
            </button>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            openProject();
          }}
          className="mt-5 pt-4 border-t border-border/60 w-full inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-foreground/50 group-hover:text-foreground transition-colors duration-300 cursor-pointer"
          style={MONT}
        >
          See More
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
}

export default function LargeProjectsSection({ heading = "Large Projects" }) {
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    base44.entities.Project.list("sort_order", 100)
      .then((rows) => setProjects(rows.filter((p) => p.visible !== false)))
      .catch(() => setProjects([]));
  }, []);

  return (
    <section className="bg-background py-24 px-6 relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-12" style={{ animation: "cardReveal 0.8s ease-out both" }}>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight" style={MONT}>
            {heading}
          </h2>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        {projects === null ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}