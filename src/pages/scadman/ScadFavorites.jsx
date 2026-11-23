import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ScadProjectCard from "@/components/scadman/ScadProjectCard";

export default function ScadFavorites() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await base44.entities.ScadFavorite.filter({}, { sort: "-created_date", limit: 60 });
        const rows = Array.isArray(res) ? res : res?.items || [];
        if (rows.length === 0) {
          if (alive) setProjects([]);
          return;
        }
        const found = await base44.entities.ScadProject.filter({
          id: { $in: rows.map((row) => row.project_id) },
        });
        const list = Array.isArray(found) ? found : found?.items || [];
        if (alive) setProjects(list);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="scad-wrap">
      <p className="scad-eyebrow">Saved</p>
      <h1 className="scad-h1 mt-2 text-[26px]">Favourites</h1>
      <p className="scad-body mt-2">
        Models you saved from the library. Favourites are private to your account.
      </p>

      {loading ? (
        <div className="mt-10 flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2e3846] border-t-[#e9b14c]" />
        </div>
      ) : projects.length === 0 ? (
        <div className="scad-panel mt-6 p-10 text-center">
          <Heart className="mx-auto h-4 w-4 text-[color:var(--scad-dim)]" />
          <p className="mt-2 text-[12px] font-semibold">Nothing saved yet</p>
          <p className="scad-body mx-auto mt-1.5 max-w-[44ch] text-[11.5px]">
            Open any published model and press Favourite to keep it here.
          </p>
          <Link to="/scadman/library" className="scad-btn scad-btn-primary mt-4">
            Browse the library
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => (
            <ScadProjectCard key={project.id} project={project} showOwner />
          ))}
        </div>
      )}
    </div>
  );
}