import { Link } from "react-router-dom";
import { AI_LINKS } from "@/lib/avgeek/links";

export default function AvgeekFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-12 pt-4">
      <div
        className="flex flex-wrap items-start justify-between gap-6 border-t pt-6"
        style={{ borderColor: "var(--ag-line)" }}
      >
        <p className="max-w-2xl text-[11.5px] leading-relaxed text-[color:var(--ag-muted)]">
          For personal use. Every external link is hand-picked and virus-checked; those sites are not mine,
          and the one thing on this page I built is the AI chatbot. Some of them are laid out for a computer
          or an extended display.
        </p>
        <div className="flex flex-col gap-1 text-[11.5px]">
          <a href={AI_LINKS.chat} target="_blank" rel="noopener noreferrer" className="hover:text-[color:var(--ag-accent)]">
            AvGeek AI Chatbot
          </a>
          <a
            href="https://sites.google.com/view/avgeekscommand/home"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[color:var(--ag-accent)]"
          >
            Original Google Site
          </a>
          <Link to="/" className="text-[color:var(--ag-muted)] hover:text-[color:var(--ag-accent)]">
            ← Back to my portfolio
          </Link>
        </div>
      </div>
      <p className="ag-mono mt-6 text-[9.5px] uppercase tracking-[0.2em] text-[color:var(--ag-muted)]">
        AvGeek Command Center · {new Date().getFullYear()}
      </p>
    </footer>
  );
}