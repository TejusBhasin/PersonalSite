import { useState } from "react";
import { KeyRound, Lock } from "lucide-react";
import { verifyPasscode } from "@/lib/mp3now/api";

export default function Mp3nowUnlock({ onUnlock }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await verifyPasscode(code.trim());
      if (data.ok) onUnlock();
      else setError("That passcode is not correct.");
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not check the passcode.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mp3now mp3-gate" data-theme="light">
      <form onSubmit={submit} className="mp3-glass mp3-denied">
        <div className="mp3-ai-badge mx-auto">
          <Lock className="h-4 w-4" />
        </div>
        <p className="mp3-wordmark mt-4">MP3now</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--m-muted)]">
          Enter the passcode to open the library.
        </p>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Passcode"
          aria-label="Passcode"
          autoFocus
          autoComplete="off"
          className="mp3-input mt-4 text-center"
        />
        {error && (
          <p className="mt-2 text-[11.5px] font-semibold" style={{ color: "var(--m-danger)" }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={busy || !code.trim()} className="mp3-btn mt-3 w-full">
          <KeyRound className="h-4 w-4" />
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}