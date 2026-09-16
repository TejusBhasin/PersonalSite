import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const hostOf = (u) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
};

export default function ProjectDetail() {
  const { slug } = useParams();
  const [project, setProject] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    setProject(undefined);
    base44.entities.Project.filter({ slug })
      .then((rows) => setProject(rows[0] || null))
      .catch(() => setProject(null));
  }, [slug]);

  if (project === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 gap-6">
        <h1 className="text-2xl font-bold" style={MONT}>
          Project not found
        </h1>
        <Link
          to="/"
          className="text-xs font-bold tracking-widest uppercase text-foreground/60 hover:text-foreground transition-colors"
          style={MONT}
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 mb-10"
        style={MONT}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground" style={MONT}>
              {project.name}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-medium tracking-wide uppercase mt-2" style={MONT}>
              {project.tagline}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-md font-semibold text-sm tracking-wide hover:bg-foreground/80 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl"
              style={MONT}
            >
              <ExternalLink className="w-4 h-4" />
              {hostOf(project.url)}
            </a>
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-border bg-card px-6 py-3 rounded-md font-semibold text-sm tracking-wide hover:border-foreground hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-lg"
                style={MONT}
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            )}
          </div>
        </div>

        {project.embed_url ? (
          <div className="mb-12">
            <div
              className="rounded-xl overflow-hidden border border-border/60 mb-3 bg-card"
              style={{ boxShadow: "0 2px 8px 0 rgba(63,69,81,0.16)" }}
            >
              <iframe
                src={project.embed_url}
                title={`${project.name} presentation`}
                loading="lazy"
                allow="fullscreen"
                className="w-full aspect-video"
              />
            </div>
            <p className="text-xs text-muted-foreground tracking-wide" style={MONT}>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-foreground/70 hover:text-foreground underline underline-offset-4 transition-colors"
              >
                {project.name}
              </a>{" "}
              by Tejus Bhasin — open the full deck
            </p>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/60 mb-12 group">
            <img src={project.preview} alt={`${project.name} preview`} loading="lazy" decoding="async" className="w-full object-cover" />
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-start mb-12">
          {(project.skills || []).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center justify-center border border-border bg-card/50 backdrop-blur-sm px-5 py-3 rounded-full text-xs font-bold text-card-foreground/80 tracking-widest uppercase"
              style={MONT}
            >
              {skill}
            </span>
          ))}
        </div>

        <section className="mb-12">
          <div className="flex items-center gap-4 mb-5">
            <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight shrink-0" style={MONT}>
              What It Does
            </h2>
            <div className="flex-1 h-px bg-border/60" />
          </div>
          <p className="text-foreground/80 leading-loose text-base text-justify font-medium">{project.summary}</p>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-4 mb-5">
            <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight shrink-0" style={MONT}>
              Why I Built It
            </h2>
            <div className="flex-1 h-px bg-border/60" />
          </div>
          <p className="text-foreground/80 leading-loose text-base text-justify font-medium">{project.why}</p>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-4 mb-5">
            <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight shrink-0" style={MONT}>
              How It Works
            </h2>
            <div className="flex-1 h-px bg-border/60" />
          </div>
          <p className="text-foreground/80 leading-loose text-base text-justify font-medium">{project.description}</p>
        </section>

        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-foreground text-background px-6 py-4 rounded-md font-semibold text-sm tracking-wide hover:bg-foreground/80 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl"
          style={MONT}
        >
          <ExternalLink className="w-4 h-4" />
          Check Out {project.name}
        </a>
      </div>
    </main>
  );
}