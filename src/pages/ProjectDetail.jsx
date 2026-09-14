import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getProjectBySlug } from "@/data/projects";

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = getProjectBySlug(slug);

  if (!project) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 gap-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}>
          Project not found
        </h1>
        <Link
          to="/"
          className="text-xs font-bold tracking-widest uppercase text-foreground/60 hover:text-foreground transition-colors"
          style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8">
      {/* Back button top left */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 mb-10"
        style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-3xl md:text-5xl font-black tracking-tight text-foreground"
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              {project.name}
            </h1>
            <p
              className="text-sm md:text-base text-muted-foreground font-medium tracking-wide uppercase mt-2"
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              {project.tagline}
            </p>
          </div>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-md font-semibold text-sm tracking-wide hover:bg-foreground/80 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl shrink-0"
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          >
            <ExternalLink className="w-4 h-4" />
            {project.url.replace("https://", "").replace("www.", "")}
          </a>
        </div>

        {/* Preview */}
        <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/60 mb-12 group">
          <img src={project.preview} alt={`${project.name} preview`} className="w-full object-cover" />
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-3 justify-start mb-12">
          {project.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center justify-center border border-border bg-card/50 backdrop-blur-sm px-5 py-3 rounded-full text-xs font-bold text-card-foreground/80 tracking-widest uppercase"
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              {skill}
            </span>
          ))}
        </div>

        {/* What it does */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-5">
            <h2
              className="text-xl md:text-2xl font-bold text-foreground tracking-tight shrink-0"
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              What It Does
            </h2>
            <div className="flex-1 h-px bg-border/60" />
          </div>
          <p className="text-foreground/80 leading-loose text-base text-justify font-medium">{project.summary}</p>
        </section>

        {/* Why I built it */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-5">
            <h2
              className="text-xl md:text-2xl font-bold text-foreground tracking-tight shrink-0"
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              Why I Built It
            </h2>
            <div className="flex-1 h-px bg-border/60" />
          </div>
          <p className="text-foreground/80 leading-loose text-base text-justify font-medium">{project.why}</p>
        </section>

        {/* How it works */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-5">
            <h2
              className="text-xl md:text-2xl font-bold text-foreground tracking-tight shrink-0"
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              How It Works
            </h2>
            <div className="flex-1 h-px bg-border/60" />
          </div>
          <p className="text-foreground/80 leading-loose text-base text-justify font-medium">{project.description}</p>
        </section>

        {/* Bottom CTA */}
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-foreground text-background px-6 py-4 rounded-md font-semibold text-sm tracking-wide hover:bg-foreground/80 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl"
          style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
        >
          <ExternalLink className="w-4 h-4" />
          Check Out {project.name}
        </a>
      </div>
    </main>
  );
}