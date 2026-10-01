import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getDeviceId } from "@/lib/deviceId";
import ServerError from "@/pages/ServerError";

// Ask a public service what IP the browser is really browsing from.
// The site itself may see a proxy IP, but this is the network's true public IP.
async function fetchPublicIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip || null;
  } catch {
    return null;
  }
}

export default function VisitTracker() {
  const location = useLocation();
  const [banned, setBanned] = useState(false);

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
        if (res?.banned || res?.data?.banned) setBanned(true);
      } catch {
        // ignore logging failures
      }
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (banned) {
    return <ServerError />;
  }

  return null;
}