import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Github, CalendarDays } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function Devlog() {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    base44.entities.Devlog.list("-created_date", 50)
      .then((rows) => setEntries(rows.filter((e) => e.visible !== false)))
      .catch(() => setEntries([]));
  }, []);

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

      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight" style={MONT}>
            Devlog
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium tracking-wide uppercase mt-2" style={MONT}>
            What I shipped this week, straight from my GitHub
          </p>
        </div>

        {entries === null ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground font-medium" style={MONT}>
            No devlog entries yet. Check back after the next weekly sync.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl p-6 md:p-10 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={MONT}>
                    {entry.title}
                  </h2>
                  {entry.week_of && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-muted-foreground" style={MONT}>
                      <CalendarDays className="w-3.5 h-3.5" />
                      {entry.week_of}
                    </span>
                  )}
                </div>

                {(entry.repos || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {entry.repos.map((repo) => (
                      <a
                        key={repo}
                        href={`https://github.com/TejusBhasin/${repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 border border-border bg-background/50 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase text-card-foreground/80 hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300"
                        style={MONT}
                      >
                        <Github className="w-3 h-3" />
                        {repo}
                      </a>
                    ))}
                  </div>
                )}

                <div
                  className="text-sm md:text-base text-foreground/80 leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_a]:text-foreground [&_a]:font-bold [&_a]:underline [&_a]:underline-offset-4 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4"
                  style={MONT}
                >
                  <ReactMarkdown>{entry.content}</ReactMarkdown>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}