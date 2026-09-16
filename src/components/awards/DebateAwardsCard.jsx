import { useState } from "react";
import { Trophy, School, ChevronDown } from "lucide-react";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const DEBATE_AWARDS = [
  {
    title: "NYCUDL Top Team Award",
    date: "Mar 2026",
    desc: "On March 7th, 2026, I got a Top Team award for parliamentary debate at an open league NYCUDL debate. My team of 3 people came 6th out of 140 teams.",
  },
  {
    title: "NYCUDL Top Team Award",
    date: "Feb 2026",
    desc: "On February 7th, 2026, I got a Top Team award for parliamentary debate at an open league NYCUDL debate. My team of 3 people came 1st out of approx 100-130 teams.",
  },
  {
    title: "NYCUDL Personal Speaker Points Award",
    date: "Feb 2026",
    desc: "On February 7th, 2026, I got a Personal Speaker Points award for parliamentary debate at an open league NYCUDL debate. I came 3rd out of roughly 250 people.",
  },
  {
    title: "NYCUDL Top Team Award",
    date: "Jan 2026",
    desc: "On January 10th, 2026, I got a Top Team award for parliamentary debate at an open league NYCUDL debate. My team of 3 people came 4th out of approx 100-120 teams.",
  },
  {
    title: "NYCUDL Top Team Award",
    date: "Nov 2025",
    desc: "On November 20th, 2025, I got a Top Team award for parliamentary debate at an open league NYCUDL debate. My team of 3 people came 9th out of approx 80-100 teams.",
  },
  {
    title: "NYCUDL Personal Speaker Points Award",
    date: "Nov 2025",
    desc: "On November 20th, 2025, I got a Personal Speaker Points award for parliamentary debate at an open league NYCUDL debate. I came 9th out of roughly 250 people.",
  },
];

export default function DebateAwardsCard() {
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
        className="mt-5 pt-4 border-t border-border/60 w-full inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-foreground/50 group-hover:text-foreground group-hover:cursor-pointer transition-colors duration-300 cursor-pointer"
        style={MONT}
      >
        {open ? "Show Less" : "Show More"}
        <ChevronDown
          className={`w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-5">
          {/* National ranking placard */}
          <div className="flex items-center gap-3 bg-foreground text-background rounded-lg px-4 py-3">
            <Trophy className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-bold" style={MONT}>
                Ranked 4th Place Nationally in Critical Thinking
              </p>
              <p className="text-xs text-background/70 mt-0.5">National ranking · Critical Thinking</p>
            </div>
          </div>

          {/* Award entries */}
          <div className="mt-1">
            {DEBATE_AWARDS.map((award, index) => (
              <div key={index} className="py-4 border-b border-border/60 last:border-b-0">
                <p className="text-sm font-bold text-foreground" style={MONT}>
                  {award.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Issued by NYCUDL · {award.date}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <School className="w-3 h-3 shrink-0" />
                  Associated with Horace Mann School
                </p>
                <p className="text-xs text-foreground/70 leading-relaxed mt-2">{award.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}