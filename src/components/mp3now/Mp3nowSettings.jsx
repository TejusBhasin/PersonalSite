import { useEffect, useState } from "react";
import { RefreshCw, Trash2, Share, Loader2, AlertTriangle, HardDrive } from "lucide-react";
import { usePlayer } from "@/lib/mp3now/player";
import { clearOfflineCache, offlineUsage } from "@/lib/mp3now/offline";
import { fmtBytes } from "@/lib/mp3now/format";

const THEMES = [
  { id: "auto", label: "Auto" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

const WARN_BYTES = 450 * 1024 * 1024;

export default function Mp3nowSettings({ onSync, syncState, onLibraryChanged }) {
  const { settings, updateSettings, markOffline } = usePlayer();
  const [usage, setUsage] = useState({ bytes: 0, count: 0 });
  const [clearing, setClearing] = useState(false);

  const refreshUsage = () => offlineUsage().then(setUsage).catch(() => null);

  useEffect(() => {
    refreshUsage();
  }, []);

  const clearCache = async () => {
    setClearing(true);
    try {
      await clearOfflineCache();
      markOffline([]);
      await refreshUsage();
      onLibraryChanged?.();
    } finally {
      setClearing(false);
    }
  };

  const nearLimit = usage.bytes > WARN_BYTES;

  return (
    <div className="mp3-scroll flex-1 overflow-y-auto px-4 pb-40 pt-3 sm:px-7">
      <h1 className="mb-4 text-[22px] font-semibold tracking-[-0.02em]">Settings</h1>

      <Card title="Library">
        <button type="button" onClick={onSync} disabled={syncState.busy} className="mp3-btn w-full">
          {syncState.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {syncState.busy ? "Syncing MEGA folders…" : "Sync Folders from MEGA"}
        </button>
        {syncState.message && (
          <p className="mt-2 text-[11.5px] leading-relaxed text-[color:var(--m-ok)]">{syncState.message}</p>
        )}
        {syncState.error && (
          <p className="mt-2 text-[11.5px] leading-relaxed text-[color:var(--m-danger)]">{syncState.error}</p>
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--m-muted)]">
          Each folder in your MEGA root becomes a playlist. Loose files land in Unsorted.
        </p>
      </Card>

      <Card title="Playback">
        <Toggle
          label="Continuous autoplay"
          hint="Keeps related songs coming when the queue ends."
          checked={settings.autoplay}
          onChange={(value) => updateSettings({ autoplay: value })}
        />
        <Toggle
          label="Start Listening card"
          hint="Show the autoplay launcher on Home."
          checked={settings.startListening}
          onChange={(value) => updateSettings({ startListening: value })}
        />
      </Card>

      <Card title="Appearance">
        <div className="flex gap-1.5">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => updateSettings({ theme: theme.id })}
              className={`mp3-pill flex-1 justify-center ${settings.theme === theme.id ? "active" : ""}`}
            >
              {theme.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[color:var(--m-muted)]">
          Auto follows your iPhone or iPad appearance.
        </p>
      </Card>

      <Card title="Offline storage">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-[color:var(--m-blue)]" />
          <span className="text-[12.5px] font-semibold">{fmtBytes(usage.bytes)}</span>
          <span className="text-[11px] text-[color:var(--m-muted)]">
            · {usage.count} song{usage.count === 1 ? "" : "s"} cached
          </span>
        </div>
        <div className="mp3-meter mt-2">
          <span style={{ width: `${Math.min(100, (usage.bytes / (1024 * 1024 * 1024)) * 100)}%` }} />
        </div>
        {nearLimit && (
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-[color:var(--m-danger)]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            iOS keeps roughly 500 MB to 1 GB for a Home Screen app. Clear some songs to keep caching working.
          </p>
        )}
        <button
          type="button"
          onClick={clearCache}
          disabled={clearing || usage.count === 0}
          className="mp3-btn mp3-btn-ghost mt-3 w-full"
        >
          {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Clear Offline Cache
        </button>
      </Card>

      <Card title="Add to Home Screen">
        <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-[color:var(--m-muted)]">
          <Share className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--m-blue)]" />
          In Safari, tap Share, then Add to Home Screen. MP3now then opens full screen with lock screen controls.
        </p>
      </Card>

      <p className="mt-5 text-center text-[10.5px] text-[color:var(--m-muted)]">
        MP3now · private library, zero ads, zero paywalls
      </p>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="mp3-glass mb-3 rounded-[20px] p-4">
      <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--m-muted)]">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 py-2 text-left"
      role="switch"
      aria-checked={checked}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-semibold text-[color:var(--m-text)]">{label}</span>
        <span className="block text-[11px] text-[color:var(--m-muted)]">{hint}</span>
      </span>
      <span
        className="relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors"
        style={{ background: checked ? "var(--m-blue)" : "var(--m-line-strong)" }}
      >
        <span
          className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? 21 : 3 }}
        />
      </span>
    </button>
  );
}