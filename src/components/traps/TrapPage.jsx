import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getDeviceId } from "@/lib/deviceId";
import { fetchPublicIp } from "@/lib/publicIp";
import ServerError from "@/pages/ServerError";

// kind = "device" blocks this device, kind = "network" blocks the whole network it sits on.
// Either way the visitor only ever sees the fake server page.
export default function TrapPage({ kind }) {
  useEffect(() => {
    (async () => {
      const clientIp = await fetchPublicIp();
      await base44.functions.invoke("trapBlock", {
        kind,
        device_id: getDeviceId(),
        client_ip: clientIp
      });
    })().catch(() => {});
  }, [kind]);

  return <ServerError />;
}