import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Reads the SiteMode dataset: value 1 = show the server error screen to everyone,
// value 0 = normal site (blocked networks/devices still see it via VisitTracker).
// Returns null while loading; falls back to 0 (site up) on any error.
export default function useServerErrorMode() {
  const [mode, setMode] = useState(null);

  useEffect(() => {
    let cancelled = false;
    base44.entities.SiteMode.list()
      .then((records) => {
        if (cancelled) return;
        const record = records.find((r) => r.key === "server_error") || records[0];
        setMode(record && record.value === 1 ? 1 : 0);
      })
      .catch(() => {
        if (!cancelled) setMode(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return mode;
}