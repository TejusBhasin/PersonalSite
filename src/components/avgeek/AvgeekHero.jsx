export default function AvgeekHero() {
  return (
    <section id="top" className="relative overflow-hidden border-b" style={{ borderColor: "var(--ag-line)" }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--ag-line) 1px, transparent 1px), linear-gradient(90deg, var(--ag-line) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "var(--ag-glow)" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <p className="ag-mono text-[11px] font-bold uppercase tracking-[0.3em] text-[color:var(--ag-accent)]">
          For AvGeeks
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
          Everything aviation, on one page.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[color:var(--ag-muted)] sm:text-lg">
          Track any flight in the air, listen to the controller clearing it, pull the airport chart, and run
          the preflight checklist, without ten tabs and a folder full of bookmarks.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <a
            href="https://www.flightradar24.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-4 py-2.5 text-[12px] font-bold tracking-wide text-white transition-transform hover:-translate-y-0.5"
            style={{ background: "var(--ag-accent)" }}
          >
            Live radar
          </a>
          <a
            href="https://www.liveatc.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border px-4 py-2.5 text-[12px] font-bold tracking-wide transition-transform hover:-translate-y-0.5"
            style={{ borderColor: "var(--ag-line)", background: "var(--ag-card)" }}
          >
            Listen to ATC
          </a>
          <a
            href="#news"
            className="rounded-lg border px-4 py-2.5 text-[12px] font-bold tracking-wide transition-transform hover:-translate-y-0.5"
            style={{ borderColor: "var(--ag-line)", background: "var(--ag-card)" }}
          >
            Aviation news
          </a>
        </div>

        <p className="ag-mono mt-10 text-[10px] uppercase tracking-[0.25em] text-[color:var(--ag-muted)]">
          Radar · ATC · Charts · Spotting · News · AI
        </p>
      </div>
    </section>
  );
}