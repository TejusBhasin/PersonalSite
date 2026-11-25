import { useCallback, useEffect, useState } from "react";
import { Lock, LogIn } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Mp3nowShell from "@/components/mp3now/Mp3nowShell";
import Mp3nowHome from "@/components/mp3now/Mp3nowHome";
import Mp3nowMiniPlayer from "@/components/mp3now/Mp3nowMiniPlayer";
import { SAMPLE_PLAYLISTS } from "@/lib/mp3now/sample";

export default function Mp3nowApp() {
  const [gate, setGate] = useState("loading");
  const [tab, setTab] = useState("home");
  const [playerOpen, setPlayerOpen] = useState(false);

  useEffect(() => {
    document.head.appendChild(meta("robots", "noindex, nofollow"));
    return () => {
      document.querySelectorAll('meta[name="robots"]').forEach((node) => {
        if (node.content.includes("noindex")) node.remove();
      });
    };
  }, []);

  useEffect(() => {
    let alive = true;
    base44.auth
      .me()
      .then((user) => {
        if (alive) setGate(user?.role === "admin" ? "ok" : "denied");
      })
      .catch((error) => {
        if (!alive) return;
        setGate(error?.status === 401 || error?.response?.status === 401 ? "signed-out" : "denied");
      });
    return () => {
      alive = false;
    };
  }, []);

  const onOpenPlaylist = useCallback(() => setTab("library"), []);

  if (gate === "loading") {
    return (
      <div className="mp3now mp3-gate">
        <div className="mp3-spinner" />
      </div>
    );
  }

  if (gate !== "ok") {
    return <Mp3nowDenied signedOut={gate === "signed-out"} />;
  }

  return (
    <div className="mp3now" data-theme="light">
      <Mp3nowShell tab={tab} onTab={setTab} hasPlayer={Boolean(playerOpen)}>
        <Mp3nowHome
          playlists={SAMPLE_PLAYLISTS}
          showAutoplay
          syncing={false}
          loading={false}
          onStartListening={() => {}}
          onOpenPlaylist={onOpenPlaylist}
          onAiPlaylist={() => {}}
        />
        <Mp3nowMiniPlayer track={null} onOpen={() => setPlayerOpen(true)} />
      </Mp3nowShell>
    </div>
  );
}

function Mp3nowDenied({ signedOut }) {
  return (
    <div className="mp3now mp3-gate" data-theme="light">
      <div className="mp3-glass mp3-denied">
        <div className="mp3-ai-badge mx-auto">
          <Lock className="h-4 w-4" />
        </div>
        <h1 className="mt-4 text-[17px] font-semibold text-[color:var(--m-text)]">MP3now is private</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--m-muted)]">
          {signedOut
            ? "Sign in with the owner account to open the library."
            : "This account does not have access to the library."}
        </p>
        {signedOut && (
          <a href="/Login" className="mp3-btn mt-4 inline-flex">
            <LogIn className="h-4 w-4" />
            Sign in
          </a>
        )}
      </div>
    </div>
  );
}

function meta(name, content) {
  const tag = document.createElement("meta");
  tag.setAttribute("name", name);
  tag.setAttribute("content", content);
  return tag;
}