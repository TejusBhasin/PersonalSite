import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Globe, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function WebProxy() {
  const [params, setParams] = useSearchParams();
  const target = params.get("url") || "";
  const [input, setInput] = useState(target);
  const [html, setHtml] = useState("");
  const [page, setPage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (raw) => {
    const url = (raw || "").trim();
    if (!url) return;
    setLoading(true);
    setError("");
    setHtml("");
    setPage("");
    try {
      const res = await base44.functions.invoke("proxyFetch", { url });
      const data = res && res.html !== undefined ? res : res?.data || {};
      if (data.error) {
        setError(data.error);
      } else {
        setHtml(data.html || "");
        const match = (data.html || "").match(/<title[^>]*>([^<]*)<\/title>/i);
        if (match) setPage(match[1].trim());
      }
    } catch (e) {
      setError(e?.message || "Could not load that site");
    }
    setLoading(false);
  };

  useEffect(() => {
    setInput(target);
    if (target) load(target);
  }, [target]);

  useEffect(() => {
    const onMessage = (e) => {
      const nav = e?.data && e.data.__proxyNav;
      if (nav) setParams({ url: nav });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [setParams]);

  const submit = (e) => {
    e.preventDefault();
    setParams(input.trim() ? { url: input.trim() } : {});
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8">
      <Link
        to="/tools"
        className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 mb-10"
        style={MONT}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground" style={MONT}>
            Web Proxy
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium tracking-wide uppercase mt-2" style={MONT}>
            {page ? `Viewing: ${page}` : "Type any web address below to browse it here"}
          </p>
        </div>

        <form onSubmit={submit} className="relative mb-6 max-w-2xl">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="example.com"
            className="w-full bg-card/80 backdrop-blur-sm border border-border/60 rounded-full pl-11 pr-28 py-3 text-sm font-semibold tracking-wide text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition-colors"
            style={MONT}
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-foreground text-background rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-80 disabled:opacity-50 transition-opacity"
            style={MONT}
          >
            {loading ? "Loading" : "Go"}
          </button>
        </form>

        {error && (
          <div className="border border-border/60 rounded-xl bg-card/80 px-5 py-6 max-w-2xl">
            <p className="text-sm font-semibold text-foreground" style={MONT}>{error}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">Try another address, some sites block proxies.</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-sm font-semibold" style={MONT}>Fetching the page...</p>
          </div>
        )}

        {html && !loading && (
          <iframe
            srcDoc={html}
            title="Proxied page"
            sandbox="allow-scripts allow-forms allow-popups"
            className="w-full h-[70vh] min-h-[420px] bg-white border border-border/60 rounded-xl"
          />
        )}

        {!html && !loading && !error && (
          <div className="border border-dashed border-border/60 rounded-xl px-5 py-12 max-w-2xl text-center">
            <Globe className="w-8 h-8 mx-auto text-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground" style={MONT}>
              Enter a web address above and press Go
            </p>
          </div>
        )}
      </div>
    </main>
  );
}