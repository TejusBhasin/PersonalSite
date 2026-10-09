import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Globe } from "lucide-react";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function Tools() {
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
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground" style={MONT}>
            Tools that don&rsquo;t need a site
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium tracking-wide uppercase mt-2" style={MONT}>
            Handy tools that run right here, no accounts and no installs
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl">
          <Link
            to="/tools/proxy"
            className="group bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl px-5 py-6 flex items-start gap-4 hover:-translate-y-1 hover:shadow-lg hover:border-foreground/30 hover:bg-card transition-all duration-300"
          >
            <Globe className="w-6 h-6 shrink-0 text-foreground/50 group-hover:text-foreground transition-colors mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground/80 group-hover:text-foreground tracking-wide" style={MONT}>
                Web Proxy
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                Type in any web address and browse it right from this page
              </p>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0 text-foreground/30 opacity-0 group-hover:opacity-100 group-hover:text-foreground transition-all duration-300 mt-1" />
          </Link>
        </div>
      </div>
    </main>
  );
}