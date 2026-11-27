import { formatDistanceToNow } from "date-fns";

export default function AvgeekArticleCard({ article, topics, watched }) {
  let when = "";
  try {
    when = article.published ? formatDistanceToNow(new Date(article.published), { addSuffix: true }) : "";
  } catch {
    when = "";
  }

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="ag-card ag-lift flex flex-col p-4"
    >
      <h4 className="text-[13.5px] font-bold leading-snug tracking-tight">{article.title}</h4>
      <p className="ag-mono mt-1.5 text-[9.5px] uppercase tracking-[0.14em] text-[color:var(--ag-muted)]">
        {article.source || "Google News"}
        {when ? ` · ${when}` : ""}
      </p>
      {article.snippet && (
        <p className="mt-2 flex-1 text-[12px] leading-relaxed text-[color:var(--ag-muted)]">
          {article.snippet}
        </p>
      )}
      {(topics.length > 0 || watched.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {watched.map((term) => (
            <span
              key={`w-${term}`}
              className="ag-mono rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white"
              style={{ background: "var(--ag-accent)" }}
            >
              {term}
            </span>
          ))}
          {topics.map((topic) => (
            <span
              key={topic}
              className="ag-mono rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[color:var(--ag-accent)]"
              style={{ background: "var(--ag-accent-soft)" }}
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}