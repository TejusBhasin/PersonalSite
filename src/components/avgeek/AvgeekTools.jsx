import { MessageSquare, Sparkles } from "lucide-react";
import AvgeekToolCard from "@/components/avgeek/AvgeekToolCard";
import { AI_LINKS, GROUPS, toolCount } from "@/lib/avgeek/links";

export default function AvgeekTools() {
  return (
    <section id="tools" className="scroll-mt-14 border-b" style={{ borderColor: "var(--ag-line)" }}>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">The toolbox</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--ag-muted)]">
              Every link hand-picked and virus-checked. Open them on a computer or extended display when
              you can; a few need landscape.
            </p>
          </div>
          <span className="ag-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ag-muted)]">
            {toolCount} tools
          </span>
        </div>

        <div className="mt-10 space-y-10">
          {GROUPS.map((group) => (
            <div key={group.id}>
              <div className="flex items-baseline gap-3">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.16em]">{group.label}</h3>
                <p className="hidden text-[12px] text-[color:var(--ag-muted)] sm:block">{group.blurb}</p>
                <div className="ml-auto hidden h-px flex-1 sm:block" style={{ background: "var(--ag-line)" }} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <AvgeekToolCard key={item.url} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          id="ai"
          className="mt-12 scroll-mt-16 rounded-2xl border p-6 sm:p-8"
          style={{ borderColor: "var(--ag-line)", background: "var(--ag-accent-soft)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <p className="ag-mono flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--ag-accent)]">
                <Sparkles className="h-3 w-3" />
                Built by me
              </p>
              <h3 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">AvGeek AI Chatbot</h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--ag-muted)]">
                Ask it anything aviation: an aircraft type, a route, a regulation, an airport. It is the one
                thing on this page I built myself.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={AI_LINKS.chat}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[12px] font-bold tracking-wide text-white transition-transform hover:-translate-y-0.5"
                style={{ background: "var(--ag-accent)" }}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Open the chat
              </a>
              <a
                href={AI_LINKS.app}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border px-4 py-2.5 text-[12px] font-bold tracking-wide transition-transform hover:-translate-y-0.5"
                style={{ borderColor: "var(--ag-line)", background: "var(--ag-card)" }}
              >
                The app
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}