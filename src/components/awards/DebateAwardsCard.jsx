import { useState } from "react";
import { Trophy, School, ChevronDown } from "lucide-react";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function DebateAwardsCard({ awards = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/60 p-8 rounded-xl hover:border-foreground/30 transition-all duration-400 group h-full flex flex-col relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-foreground/5 rounded-full blur-2xl group-hover:bg-foreground/10 transition-colors duration-500" />

      <Trophy className="w-8 h-8 text-foreground/60 mb-5 group-hover:text-foreground group-hover:scale-110 transition-all duration-300" />
      <h3 className="text-base font-bold text-foreground tracking-wide mb-3" style={MONT}>
        Debate Awards
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        Won numerous awards in parliamentary debate competitions.
      </p>

      <button
        onClick={() => setOpen(!open)}
        className="mt-5 pt-4 border-t border-border/60 w-full inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-foreground/50 group-hover:text-foreground transition-colors duration-300 cursor-pointer"
        style={MONT}
      >
        {open ? "Show Less" : "Show More"}
        <ChevronDown
          className={`w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-1">
          {awards.map((award) => (
            <div key={award.id} className="py-4 border-b border-border/60 last:border-b-0">
              <p className="text-sm font-bold text-foreground" style={MONT}>
                {award.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {[award.issuer ? `Issued by ${award.issuer}` : null, award.issued_date].filter(Boolean).join(" · ")}
              </p>
              {award.association && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <School className="w-3 h-3 shrink-0" />
                  Associated with {award.association}
                </p>
              )}
              <p className="text-xs text-foreground/70 leading-relaxed mt-2">{award.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}