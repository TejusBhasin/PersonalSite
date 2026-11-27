import { ArrowUpRight } from "lucide-react";

export default function AvgeekToolCard({ item }) {
  const Icon = item.icon;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="ag-card ag-lift group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={item.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(to top, var(--ag-card) 2%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.18) 100%)" }}
        />
        <span
          className="absolute bottom-2.5 left-3 flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm"
          style={{ background: "var(--ag-card)", borderColor: "var(--ag-line)", color: "var(--ag-accent)" }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <ArrowUpRight
          className="absolute right-3 top-3 h-4 w-4 text-white/85 drop-shadow transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <h3 className="text-[13.5px] font-bold tracking-tight">{item.name}</h3>
        <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-[color:var(--ag-muted)]">{item.desc}</p>
        <p
          className="ag-mono mt-3 border-t pt-2.5 text-[9.5px] uppercase tracking-[0.14em] text-[color:var(--ag-muted)]"
          style={{ borderColor: "var(--ag-line)" }}
        >
          {item.host}
        </p>
      </div>
    </a>
  );
}