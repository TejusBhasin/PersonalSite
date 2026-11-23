import { Link } from "react-router-dom";
import { ArrowRight, Boxes, Code2, Layers, Sparkles } from "lucide-react";
import ScadMark from "@/components/scadman/ScadMark";
import ScadIntegrationStatus from "@/components/scadman/ScadIntegrationStatus";

const SAMPLE = `// phone stand, fully parametric
$fn = 48;
width   = 78;   // mm
depth   = 92;
height  = 64;
tilt    = 62;   // degrees

module stand() {
  difference() {
    cube([width, depth, 6]);
    translate([width/2, depth/2, -1])
      cylinder(h = 8, d = 22);
  }
  translate([0, 0, 6])
    rotate([tilt, 0, 0])
      cube([width, 8, height]);
}

stand();`;

const METHODS = [
  {
    icon: Sparkles,
    title: "Describe it, get OpenSCAD",
    body: "Tell SCADman what you need. You get complete parametric source code, the parameters behind it, and the assumptions that were made, ready to review before anything changes.",
  },
  {
    icon: Code2,
    title: "Or write the code yourself",
    body: "A real OpenSCAD editor with highlighting, line numbers and diagnostics, working on the same project source the assistant reads and writes.",
  },
  {
    icon: Layers,
    title: "Parametric by default",
    body: "Dimensions live as structured parameters, not buried constants. Adjust a slider, the source variable and the preview both follow.",
  },
  {
    icon: Boxes,
    title: "Built for sharing",
    body: "Publish a model with its source, parameters and licence. Others can remix it with attribution kept intact.",
  },
];

export default function ScadLanding() {
  return (
    <div className="scadman">
      <header className="border-b" style={{ borderColor: "var(--scad-line)" }}>
        <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-3 px-6">
          <Link to="/scadman" className="flex items-center gap-2.5">
            <ScadMark size={24} />
            <span className="text-[15px] font-extrabold tracking-tight">
              SCAD<span className="scad-dim">man</span>
            </span>
          </Link>
          <span className="scad-chip ml-2 hidden sm:inline-flex">beta</span>
          <div className="flex-1" />
          <Link to="/scadman/library" className="scad-btn scad-btn-ghost scad-btn-sm">
            Community library
          </Link>
          <Link to="/scadman/login" className="scad-btn scad-btn-primary scad-btn-sm">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-6">
        <section className="grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="scad-eyebrow">AI-assisted parametric CAD</p>
            <h1 className="scad-h1 mt-4 text-[38px] sm:text-[46px]">
              Imagine it.
              <br />
              Parametrize it.
              <br />
              <span style={{ color: "var(--scad-accent)" }}>Print it.</span>
            </h1>
            <p className="scad-body mt-5 max-w-[46ch]">
              SCADman is a modelling workspace for OpenSCAD. Describe a part in plain
              language, review the code it produces, adjust real parameters, and preview the
              geometry in the viewport before you commit to a print.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/scadman/login" className="scad-btn scad-btn-primary h-10 px-5">
                Continue with Google
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link to="/scadman/library" className="scad-btn h-10 px-5">
                Browse models
              </Link>
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--scad-dim)]">
              Google is the only sign-in method
            </p>
          </div>

          <div className="scad-panel overflow-hidden">
            <div
              className="flex items-center gap-2 border-b px-3 py-2"
              style={{ borderColor: "var(--scad-line)" }}
            >
              <span className="scad-chip">phone_stand.scad</span>
              <span className="scad-chip scad-chip-warn">subset preview</span>
              <div className="flex-1" />
              <span className="scad-mono text-[10px] text-[color:var(--scad-dim)]">
                78 × 92 × 64 mm
              </span>
            </div>
            <pre className="scad-code max-h-[300px] rounded-none border-0">{SAMPLE}</pre>
            <div
              className="grid grid-cols-3 border-t text-center"
              style={{ borderColor: "var(--scad-line)" }}
            >
              {[
                ["Parameters", "4 exposed"],
                ["Booleans", "2 cuts"],
                ["Licence", "CC BY-NC"],
              ].map(([k, v]) => (
                <div key={k} className="px-2 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[color:var(--scad-dim)]">
                    {k}
                  </p>
                  <p className="mt-1 text-[11.5px] font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-12" style={{ borderColor: "var(--scad-line)" }}>
          <p className="scad-eyebrow">Two ways in, one project</p>
          <h2 className="scad-h2 mt-2">Assistance where you want it, code where you need it</h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {METHODS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="scad-card">
                <Icon className="h-4 w-4" style={{ color: "var(--scad-accent)" }} />
                <h3 className="scad-h3 mt-3">{title}</h3>
                <p className="scad-body mt-2">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t py-12" style={{ borderColor: "var(--scad-line)" }}>
          <p className="scad-eyebrow">Integration status</p>
          <h2 className="scad-h2 mt-2">What is actually running today</h2>
          <p className="scad-body mt-2 max-w-[70ch]">
            Every external service is an adapter with a visible status. Nothing is reported as
            compiled, sliced or exported unless the engine behind it really did the work.
          </p>
          <div className="scad-panel mt-6 overflow-hidden">
            <ScadIntegrationStatus />
          </div>
        </section>
      </main>

      <footer className="border-t" style={{ borderColor: "var(--scad-line)" }}>
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3 px-6 py-6">
          <ScadMark size={18} />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--scad-dim)]">
            SCADman — imagine it. parametrize it. print it.
          </span>
          <div className="flex-1" />
          <Link to="/" className="scad-btn scad-btn-ghost scad-btn-sm">
            tejusbhasin.info
          </Link>
        </div>
      </footer>
    </div>
  );
}