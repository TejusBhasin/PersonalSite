import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getDeviceId } from "@/lib/deviceId";
import { fetchPublicIp } from "@/lib/publicIp";
import ServerError from "@/pages/ServerError";

const CACHE_KEY = "tejus_access_verdict";
const CACHE_TTL = 5 * 60 * 1000;

// Last known verdict, so repeat visits render instantly without waiting.
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached || typeof cached.at !== "number" || Date.now() - cached.at > CACHE_TTL) return null;
    return cached.banned ? "blocked" : "ok";
  } catch {
    return null;
  }
}

function writeCache(banned) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ banned, at: Date.now() }));
  } catch {
    /* storage unavailable */
  }
}

// Gates the whole site: nothing renders until the visitor is known to be allowed,
// so a blocked network or device never sees a glimpse of the page.
export default function VisitTracker({ children }) {
  const location = useLocation();
  const [verdict, setVerdict] = useState(readCache);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const clientIp = await fetchPublicIp();
      if (cancelled) return;
      try {
        const res = await base44.functions.invoke("logVisit", {
          path: location.pathname,
          device_id: getDeviceId(),
          client_ip: clientIp
        });
        const banned = Boolean(res?.banned ?? res?.data?.banned);
        if (cancelled) return;
        setVerdict(banned ? "blocked" : "ok");
        writeCache(banned);
      } catch {
        // a failed check never blocks the site
        if (!cancelled) setVerdict((v) => v ?? "ok");
      }
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (verdict === "blocked") return <ServerError />;
  if (verdict === null) return <div className="fixed inset-0 bg-background" />;
  return children;
}