import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { signInWithProvider } from "@/lib/authMfaFlow";
import ScadMark from "@/components/scadman/ScadMark";
import GoogleIcon from "@/components/GoogleIcon";
import ScadIntegrationStatus from "@/components/scadman/ScadIntegrationStatus";

export default function ScadSignIn() {
  const { isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) window.location.replace("/scadman/home");
  }, [isAuthenticated]);

  const handleGoogle = async () => {
    setBusy(true);
    setError("");
    try {
      await signInWithProvider("google", "/scadman/home");
    } catch (e) {
      setError(
        "Google sign-in could not start. Enable Google as a sign-in method for this app in Settings → Authentication, then try again."
      );
      setBusy(false);
    }
  };

  return (
    <div className="scadman flex min-h-screen flex-col">
      <header className="border-b" style={{ borderColor: "var(--scad-line)" }}>
        <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-2.5 px-6">
          <Link to="/scadman" className="flex items-center gap-2.5">
            <ScadMark size={22} />
            <span className="text-[14px] font-extrabold tracking-tight">
              SCAD<span className="scad-dim">man</span>
            </span>
          </Link>
          <div className="flex-1" />
          <Link to="/scadman/library" className="scad-btn scad-btn-ghost scad-btn-sm">
            Library
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1180px] flex-1 items-center gap-10 px-6 py-12 lg:grid-cols-2">
        <div className="scad-panel mx-auto w-full max-w-[400px] p-6">
          <p className="scad-eyebrow">Sign in</p>
          <h1 className="scad-h2 mt-2">Open your workspace</h1>
          <p className="scad-body mt-2">
            SCADman uses your Google account. That is the only sign-in method, and it is what ties
            your projects, parameters and published models to you.
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="scad-btn scad-btn-primary mt-6 h-10 w-full"
          >
            <GoogleIcon className="h-4 w-4" />
            {busy ? "Opening Google…" : "Continue with Google"}
          </button>

          {error && (
            <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--scad-err)" }}>
              {error}
            </p>
          )}

          <p className="mt-5 border-t pt-3 text-[10px] leading-relaxed text-[color:var(--scad-dim)]" style={{ borderColor: "var(--scad-line)" }}>
            No email and password accounts, no other providers. Published models stay readable
            without signing in.
          </p>
        </div>

        <div className="hidden lg:block">
          <p className="scad-eyebrow">Integration status</p>
          <h2 className="scad-h2 mt-2">Nothing pretends to be connected</h2>
          <div className="scad-panel mt-4 overflow-hidden">
            <ScadIntegrationStatus />
          </div>
        </div>
      </main>
    </div>
  );
}