import { Link } from "react-router-dom";
import { Lock, Eye, Globe, Heart } from "lucide-react";
import ScadThumb from "./ScadThumb";
import { categoryLabel, LICENSE_SHORT, timeAgo } from "@/lib/scad/format";

const VIS_ICON = { private: Lock, unlisted: Eye, public: Globe };

export default function ScadProjectCard({ project, actions, footer, showOwner = false, href }) {
  const VisIcon = VIS_ICON[project.visibility] || Lock;
  const to = href || `/scadman/library/${project.slug}`;
  return (
    <div className="scad-card scad-card-hover flex flex-col gap-3 p-0">
      <Link to={to} className="block">
        <ScadThumb seed={project.slug || project.id} label={project.title} className="h-[104px] w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link
              to={to}
              className="block truncate text-[12.5px] font-bold hover:text-[color:var(--scad-accent)]"
            >
              {project.title}
            </Link>
            <p className="mt-0.5 truncate text-[10.5px] uppercase tracking-[0.1em] text-[color:var(--scad-dim)]">
              {categoryLabel(project.category)} · {timeAgo(project.updated_date || project.created_date)}
            </p>
          </div>
          {project.favorite_count > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[color:var(--scad-dim)]">
              <Heart className="h-3 w-3" />
              {project.favorite_count}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {project.is_sample && <span className="scad-chip">sample</span>}
          {project.status === "published" ? (
            <span className="scad-chip scad-chip-ok">published</span>
          ) : (
            <span className="scad-chip">draft</span>
          )}
          <span className="scad-chip">
            <VisIcon className="h-2.5 w-2.5" />
            {project.visibility}
          </span>
          <span className="scad-chip">{LICENSE_SHORT[project.license] || "CC BY"}</span>
          {project.original_project_id && <span className="scad-chip scad-chip-warn">remix</span>}
        </div>

        {showOwner && project.creator_name && (
          <p className="text-[10.5px] text-[color:var(--scad-dim)]">by {project.creator_name}</p>
        )}

        {footer}

        {actions && <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">{actions}</div>}
      </div>
    </div>
  );
}