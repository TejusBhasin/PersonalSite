import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MonitorSmartphone, ShieldBan } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function Visits() {
  const [visits, setVisits] = useState(null);
  const [error, setError] = useState(null);
  const [banning, setBanning] = useState(null);

  const load = () => {
    base44.entities.VisitLog.list("-created_date", 200)
      .then(setVisits)
      .catch(() => setError("You need to be logged in as an admin to view visit logs."));
  };

  useEffect(() => {
    load();
  }, []);

  const banDevice = async (v) => {
    if (!window.confirm(`Block this device (${v.device_id}) from viewing the site?`)) return;
    setBanning(v.id + "-device");
    try {
      await base44.entities.Banned.create({ device_id: v.device_id, notes: `Banned from Visits page (${v.path})` });
    } catch {}
    setBanning(null);
  };

  const banNetwork = async (v) => {
    const ip = v.client_ip || v.ip;
    if (!window.confirm(`Block the entire network with public IP ${ip}?`)) return;
    setBanning(v.id + "-network");
    try {
      await base44.entities.BlockedNetwork.create({ ip, label: "Blocked from Visits page", notes: `Auto-blocked after visit to ${v.path}` });
    } catch {}
    setBanning(null);
  };

  const uniqueIps = visits ? new Set(visits.map((v) => v.client_ip || v.ip)).size : 0;

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

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight" style={MONT}>
            Site Visits
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium tracking-wide uppercase mt-2" style={MONT}>
            Visitors, their real public IPs, and one-click blocking
          </p>
        </div>

        {error ? (
          <p className="text-sm text-muted-foreground font-medium" style={MONT}>{error}</p>
        ) : visits === null ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
          </div>
        ) : visits.length === 0 ? (
          <p className="text-sm text-muted-foreground font-medium" style={MONT}>
            No visits logged yet.
          </p>
        ) : (
          <>
            <p className="text-xs font-bold tracking-widest uppercase text-foreground/60 mb-6" style={MONT}>
              {visits.length} recent visits · {uniqueIps} unique IP addresses
            </p>
            <div className="overflow-x-auto border border-border/60 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-foreground text-background text-left" style={MONT}>
                    <th className="px-4 py-3 font-bold tracking-wide text-xs uppercase">Date</th>
                    <th className="px-4 py-3 font-bold tracking-wide text-xs uppercase">Time</th>
                    <th className="px-4 py-3 font-bold tracking-wide text-xs uppercase">Real IP</th>
                    <th className="px-4 py-3 font-bold tracking-wide text-xs uppercase">Page</th>
                    <th className="px-4 py-3 font-bold tracking-wide text-xs uppercase">Browser</th>
                    <th className="px-4 py-3 font-bold tracking-wide text-xs uppercase text-right">Block</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id} className="border-t border-border/60 odd:bg-card/50">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(v.created_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(v.created_date).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                        {v.client_ip || v.ip}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{v.path}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{v.user_agent}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => banDevice(v)}
                            disabled={banning === v.id + "-device"}
                            title="Block this device"
                            className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-md text-xs font-bold tracking-wide uppercase hover:border-foreground hover:-translate-y-0.5 transition-all disabled:opacity-50"
                            style={MONT}
                          >
                            <MonitorSmartphone className="w-3.5 h-3.5" />
                            Device
                          </button>
                          <button
                            onClick={() => banNetwork(v)}
                            disabled={banning === v.id + "-network"}
                            title="Block this visitor's whole network"
                            className="inline-flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 rounded-md text-xs font-bold tracking-wide uppercase hover:bg-foreground/80 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                            style={MONT}
                          >
                            <ShieldBan className="w-3.5 h-3.5" />
                            Network
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}