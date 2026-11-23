import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";

function usernameFrom(user) {
  const base = (user?.email || "maker").split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 18) || "maker";
  return `${base}${Math.floor(Math.random() * 900 + 100)}`;
}

export default function useScadProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) {
        if (alive) setLoading(false);
        return;
      }
      try {
        const list = await base44.entities.ScadProfile.list();
        const rows = Array.isArray(list) ? list : list?.items || [];
        let record = rows[0];
        if (!record) {
          record = await base44.entities.ScadProfile.create({
            display_name: user.full_name || "",
            username: usernameFrom(user),
            avatar_url: user.avatar_url || user.picture || "",
            default_visibility: "private",
            autosave: true,
            editor_font_size: 12,
            editor_tab_width: 2,
            nozzle_diameter: 0.4,
            filament_type: "PLA",
            slicer: "PrusaSlicer",
            infill_percent: 15,
            layer_height: 0.2,
            bed_temp: 60,
            nozzle_temp: 210,
          });
        }
        if (alive) setProfile(record);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  return { profile, setProfile, loading };
}