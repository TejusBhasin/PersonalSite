import { Home, Search, Library, Settings } from "lucide-react";

export const TABS = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "library", label: "Library", icon: Library },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Mp3nowShell({ tab, onTab, children, hasPlayer }) {
  return (
    <div className="mp3-shell">
      <aside className="mp3-sidebar">
        <div className="px-5 pb-6 pt-7">
          <span className="mp3-wordmark-sm">MP3now</span>
          <p className="mt-1.5 text-[11.5px] text-[color:var(--m-muted)]">Private cloud library</p>
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              className={`mp3-navlink ${tab === id ? "active" : ""}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto px-5 py-5 text-[10.5px] leading-relaxed text-[color:var(--m-muted)]">
          Zero ads. Zero paywalls.
        </div>
      </aside>

      <div className={`mp3-content ${hasPlayer ? "with-player" : ""}`}>
        {children}
        <nav className="mp3-tabbar">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              className={`mp3-tab ${tab === id ? "active" : ""}`}
              aria-label={label}
            >
              <Icon className="h-[19px] w-[19px]" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}