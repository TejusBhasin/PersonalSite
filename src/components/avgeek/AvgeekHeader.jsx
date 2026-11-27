import { Link } from "react-router-dom";
import { Plane, Moon, Sun } from "lucide-react";

const NAV = [
  { href: "#tools", label: "Tools" },
  { href: "#news", label: "News" },
  { href: "#ai", label: "AI" },
];

export default function AvgeekHeader({ theme, onToggleTheme }) {
  return (
    <header
      className="sticky top-0 z-30 border-b bg-[color:var(--ag-card)] backdrop-blur"
      style={{ borderColor: "var(--ag-line)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5">
        <a href="#top" className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--ag-accent)", color: "#fff" }}
          >
            <Plane className="h-4 w-4" />
          </span>
          <span className="text-[13px] font-bold tracking-tight sm:text-sm">AvGeek Command Center</span>
        </a>

        <nav className="ml-auto flex items-center gap-0.5">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="ag-mono rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--ag-muted)] transition-colors hover:bg-[color:var(--ag-accent-soft)] hover:text-[color:var(--ag-accent)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border text-[color:var(--ag-muted)] transition-colors hover:text-[color:var(--ag-accent)]"
          style={{ borderColor: "var(--ag-line)" }}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <Link
          to="/"
          className="ag-mono hidden rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--ag-muted)] transition-colors hover:text-[color:var(--ag-accent)] sm:block"
          style={{ borderColor: "var(--ag-line)" }}
        >
          Portfolio
        </Link>
      </div>
    </header>
  );
}