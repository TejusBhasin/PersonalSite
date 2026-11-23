import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Code2, Sparkles, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import useScadProfile from "@/hooks/useScadProfile";
import { replaceParameters } from "@/lib/scad/api";
import { extractVariables, slugify } from "@/lib/scad/format";

const TEMPLATES = [
  {
    id: "blank",
    title: "Blank parametric file",
    body: "A commented skeleton with the conventions SCADman expects.",
    code: `// Parametric model — edit the dimensions below.
// Units: millimetres.

width  = 60;   // overall width
depth  = 40;   // overall depth
height = 25;   // overall height
wall   = 2.5;  // wall thickness

$fn = 48;

module build() {
  difference() {
    cube([width, depth, height]);
    translate([wall, wall, wall])
      cube([width - 2 * wall, depth - 2 * wall, height]);
  }
}

build();
`,
  },
  {
    id: "organizer",
    title: "Desk organizer",
    body: "Three compartments with a cable channel.",
    code: `// Desk organizer with compartments
width   = 120;
depth   = 80;
height  = 45;
wall    = 2.4;
bays    = 3;

$fn = 48;

module build() {
  difference() {
    cube([width, depth, height]);
    translate([wall, wall, wall])
      cube([width - 2 * wall, depth - 2 * wall, height]);
    for (i = [1 : bays - 1])
      translate([i * width / bays - wall / 2, wall, wall])
        cube([wall, depth - 2 * wall, height]);
    translate([width / 2, depth - wall - 6, -1])
      cylinder(h = height + 2, d = 14);
  }
}

build();
`,
  },
  {
    id: "enclosure",
    title: "Electronics enclosure",
    body: "Box with wall bosses and a screw-down lid.",
    code: `// Enclosure with lid
inner_width  = 70;
inner_length = 45;
inner_height = 22;
wall         = 2.4;
lid_height   = 3;
boss_d       = 6;

$fn = 32;

module body() {
  difference() {
    cube([inner_width + 2 * wall, inner_length + 2 * wall, inner_height + wall]);
    translate([wall, wall, wall])
      cube([inner_width, inner_length, inner_height + 1]);
    for (x = [0, 1], y = [0, 1])
      translate([wall + boss_d / 2 + x * (inner_width - boss_d),
                 wall + boss_d / 2 + y * (inner_length - boss_d), -1])
        cylinder(h = 10, d = 2.6);
  }
  for (x = [0, 1], y = [0, 1])
    translate([wall + boss_d / 2 + x * (inner_width - boss_d),
               wall + boss_d / 2 + y * (inner_length - boss_d), wall])
      cylinder(h = 8, d = boss_d);
}

module lid() {
  translate([0, 0, inner_height + wall + 6])
    difference() {
      cube([inner_width + 2 * wall, inner_length + 2 * wall, lid_height]);
      for (x = [0, 1], y = [0, 1])
        translate([wall + boss_d / 2 + x * (inner_width - boss_d),
                   wall + boss_d / 2 + y * (inner_length - boss_d), -1])
          cylinder(h = lid_height + 2, d = 2.6);
    }
}

body();
lid();
`,
  },
];

function deriveTitle(prompt) {
  const clean = prompt.replace(/\s+/g, " ").trim();
  if (!clean) return "Untitled model";
  return clean.length > 58 ? `${clean.slice(0, 55)}…` : clean;
}

export default function ScadCreate() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useScadProfile();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const startInCode = params.get("mode") === "code";

  const create = async ({ title, code, description, withPrompt }) => {
    setBusy(title || "ai");
    setError("");
    try {
      const project = await base44.entities.ScadProject.create({
        title: title || deriveTitle(prompt),
        slug: slugify(title || prompt || "model"),
        description: description || (prompt ? prompt.slice(0, 500) : ""),
        source_code: code || "",
        visibility: profile?.default_visibility || "private",
        status: "draft",
        category: "other",
        license: "CC-BY-4.0",
        creator_name: user?.full_name || "",
        is_sample: false,
      });
      const vars = extractVariables(code || "");
      if (vars.length) await replaceParameters(project.id, vars);
      navigate(`/scadman/editor/${project.id}`, {
        state: withPrompt ? { prompt: withPrompt } : undefined,
      });
    } catch (e) {
      setError(e.message || "Could not create the project.");
      setBusy(null);
    }
  };

  const generate = () => {
    const value = prompt.trim();
    if (!value) {
      setError("Describe what you want to build first.");
      return;
    }
    create({ title: deriveTitle(value), code: "", withPrompt: value });
  };

  return (
    <div className="scad-wrap max-w-[980px]">
      <p className="scad-eyebrow">New project</p>
      <h1 className="scad-h1 mt-2 text-[26px]">What are we building?</h1>
      <p className="scad-body mt-2 max-w-[66ch]">
        Write a request in plain language. The assistant returns complete OpenSCAD source plus the
        parameters behind it, and you decide whether to apply it.
      </p>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="scad-panel p-4">
          <label className="scad-label" htmlFor="scad-prompt">
            Describe the model
          </label>
          <textarea
            id="scad-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            placeholder="A desk organizer with three compartments, a slot for my phone, and a circular hole for a charging cable."
            className="scad-textarea"
            autoFocus={!startInCode}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={generate}
              disabled={busy !== null}
              className="scad-btn scad-btn-primary h-9 px-4"
            >
              <Wand2 className="h-3.5 w-3.5" />
              {busy === "ai" ? "Opening studio…" : "Generate with AI"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => create({ title: "Untitled model", code: "", withPrompt: null })}
              disabled={busy !== null}
              className="scad-btn h-9 px-4"
            >
              <Code2 className="h-3.5 w-3.5" />
              Start from code
            </button>
          </div>
          {error && (
            <p className="mt-3 text-[11px]" style={{ color: "var(--scad-err)" }}>
              {error}
            </p>
          )}
          <p className="mt-3 border-t pt-3 text-[10.5px] leading-relaxed text-[color:var(--scad-dim)]" style={{ borderColor: "var(--scad-line)" }}>
            The assistant writes source only. Preview geometry comes from SCADman's built-in subset
            engine, and exports stay disabled until a real OpenSCAD engine is connected.
          </p>
        </div>

        <div>
          <p className="scad-label">Start from a template</p>
          <div className="space-y-2">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  create({
                    title: template.title,
                    code: template.code,
                    description: template.body,
                    withPrompt: null,
                  })
                }
                className="scad-card scad-card-hover w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--scad-accent)" }} />
                  <span className="text-[12px] font-bold">{template.title}</span>
                </div>
                <p className="scad-body mt-1.5 text-[11px]">{template.body}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}