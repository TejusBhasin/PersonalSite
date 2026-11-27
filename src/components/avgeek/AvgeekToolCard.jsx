import { ArrowUpRight } from "lucide-react";

export default function AvgeekToolCard({ item }) {
  const Icon = item.icon;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="ag-card ag-lift group flex flex-col p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--ag-accent-soft)", color: "var(--ag-accent)" }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-[color:var(--ag-muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[color:var(--ag-accent)]" />
      </div>

      <h3 className="mt-3 text-[13.5px] font-bold tracking-tight">{item.name}</h3>
      <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-[color:var(--ag-muted)]">{item.desc}</p>
      <p className="ag-mono mt-3 border-t pt-2.5 text-[9.5px] uppercase tracking-[0.14em] text-[color:var(--ag-muted)]" style={{ borderColor: "var(--ag-line)" }}>
        {item.host}
      </p>
    </a>
  );
}