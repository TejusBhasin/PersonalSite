import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Compass,
  FolderOpen,
  Heart,
  Home,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import ScadMark from "./ScadMark";

const NAV = [
  { to: "/scadman/home", label: "Home", icon: Home },
  { to: "/scadman/create", label: "Create", icon: Sparkles },
  { to: "/scadman/projects", label: "My Projects", icon: FolderOpen },
  { to: "/scadman/library", label: "Explore Library", icon: Compass },
  { to: "/scadman/favorites", label: "Favorites", icon: Heart },
  { to: "/scadman/settings", label: "Settings", icon: Settings },
];

function initials(user) {
  const name = user?.full_name || user?.email || "?";
  return name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function ScadLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const active = NAV.find((item) => location.pathname.startsWith(item.to));

  const signOut = () => base44.auth.logout("/scadman");

  const sidebar = (
    <aside className="scad-sidebar">
      <div
        className="flex h-14 items-center gap-2.5 border-b px-4"
        style={{ borderColor: "var(--scad-line)" }}
      >
        <Link to="/scadman/home" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <ScadMark size={22} />
          <span className="text-[14px] font-extrabold tracking-tight">
            SCAD<span className="scad-dim">man</span>
          </span>
        </Link>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="scad-btn scad-btn-ghost scad-btn-sm lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 pt-3">
        <Link
          to="/scadman/create"
          onClick={() => setOpen(false)}
          className="scad-btn scad-btn-primary w-full"
        >
          <Plus className="h-3.5 w-3.5" />
          New project
        </Link>
      </div>

      <nav className="scad-nav">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) => `scad-navlink${isActive ? " active" : ""}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="border-t p-3" style={{ borderColor: "var(--scad-line)" }}>
        {!user && (
          <Link to="/scadman/login" onClick={() => setOpen(false)} className="scad-btn scad-btn-primary w-full">
            Sign in with Google
          </Link>
        )}
        <div className={`flex items-center gap-2.5${user ? "" : " hidden"}`}>
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: "var(--scad-panel-3)", color: "var(--scad-accent)" }}
            >
              {initials(user)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold">{user?.full_name || "Maker"}</p>
            <p className="truncate text-[10px] text-[color:var(--scad-dim)]">{user?.email}</p>
          </div>
        </div>
        <div className={`mt-2 flex items-center gap-1.5${user ? "" : " hidden"}`}>
          <Link to="/scadman/settings" onClick={() => setOpen(false)} className="scad-btn scad-btn-sm flex-1">
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
          <button type="button" onClick={signOut} className="scad-btn scad-btn-sm" title="Sign out">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="scadman">
      <div className="scad-shell">
        <div className="hidden lg:block">{sidebar}</div>

        {open && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
            <div className="flex">{sidebar}</div>
          </div>
        )}

        <div className="scad-maincol">
          <header className="scad-topbar">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="scad-btn scad-btn-ghost scad-btn-sm lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--scad-dim)]">
              {active?.label || "SCADman"}
            </span>
            <div className="flex-1" />
            <Link to="/scadman/library" className="scad-btn scad-btn-sm">
              <Compass className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Library</span>
            </Link>
          </header>
          <main className="scad-page">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}