import { ExternalLink, CheckCircle2, XCircle } from "lucide-react";

export default function InstancesPanel({ instances }) {
  if (instances.length === 0) {
    return <p className="max-w-5xl mx-auto px-4 py-6 text-sm text-neutral-500">No instances synced yet.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
        {instances.map((inst) => (
          <div
            key={inst.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 bg-neutral-900/40 hover:bg-neutral-900 transition-colors"
          >
            <div className="min-w-[220px] flex items-center gap-2">
              {inst.down ? (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              )}
              <span className="text-sm font-medium truncate">{inst.flag} {inst.name}</span>
            </div>
            <span className="text-xs text-neutral-500">{inst.region || "?"}</span>
            <span className="text-xs text-neutral-400">{Math.round(inst.uptime || 0)}% uptime</span>
            <span className="text-xs text-neutral-500">{(inst.users || 0).toLocaleString()} users</span>
            {inst.version && <span className="text-xs text-neutral-600 hidden md:inline">{inst.version}</span>}
            <a
              href={inst.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Visit <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}