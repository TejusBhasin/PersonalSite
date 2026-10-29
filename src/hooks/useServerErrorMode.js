import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Reads the SiteMode dataset:
//   0 = normal site (blocked networks/devices still see the screen via VisitTracker)
//   1 = show the server error screen to everyone
//   3 = show the screen only off the Base44 domain (e.g. on tejusbhasin.info),
//       while everything stays normal on tejusbhasin.base44.app
// Returns null while loading; falls back to 0 (site up) on any error.
const BASE44_HOST = "tejusbhasin.base44.app";

function isBase44Host() {
  return window.location.hostname.toLowerCase() === BASE44_HOST;
}

export default function useServerErrorMode() {
  const [mode, setMode] = useState(null);

  useEffect(() => {
    let cancelled = false;
    base44.entities.SiteMode.list()
      .then((records) => {
        if (cancelled) return;
        const record = records.find((r) => r.key === "server_error") || records[0];
        const value = record ? Number(record.value) : 0;
        if (value === 1) setMode(1);
        else if (value === 3) setMode(isBase44Host() ? 0 : 1);
        else setMode(0);
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