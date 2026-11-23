// OpenSCAD knowledge used by the SCADman assistant.
//
// IMPORTANT: this is a curated, hand-written reference that is retrieved per request and
// placed in the prompt (keyword retrieval over the chunks below). It is NOT a model trained on
// a private corpus, and nothing here should be described as training data. Swap
// retrieveKnowledge() for a real embedding/RAG index and the rest of the app keeps working.

const CHUNKS = [
  {
    id: "language-basics",
    title: "Language basics",
    keywords: ["variable", "assignment", "semicolon", "comment", "syntax", "number", "string"],
    text: `OpenSCAD is a declarative language. Statements are separated by semicolons. Comments use // or /* */.
Variables are assigned once at parse time: width = 40; They are not mutable like in imperative languages.
Special variables: $fn (fragment count for round shapes), $fa (minimum angle), $fs (minimum size).
Setting $fn = 0 lets $fa/$fs decide. $fn = 64 on a small cylinder is usually wasteful; 32-48 is plenty.
Arrays: dims = [40, 30, 12]; access with dims[0]. Ranges: [0:5] and [0:2:10].
Ternary and boolean operators work: w = big ? 100 : 60; if (x > 0) { ... }`,
  },
  {
    id: "primitives",
    title: "3D primitives",
    keywords: ["cube", "sphere", "cylinder", "polyhedron", "primitive", "size", "center", "r", "d"],
    text: `cube(size, center=false) — size may be a number or [x, y, z].
sphere(r=) or sphere(d=, $fn=) — centred on the origin.
cylinder(h=, r= | r1=, r2=, d=, center=false) — r1 is the bottom radius, r2 the top; r1 != r2 gives a cone.
polyhedron(points=[[x,y,z],...], faces=[[0,1,2],...]) — faces are index lists, counter-clockwise seen from outside.
2D primitives (circle, square, polygon) need linear_extrude() or rotate_extrude() to become solids.`,
  },
  {
    id: "transforms",
    title: "Transformations",
    keywords: ["translate", "rotate", "scale", "mirror", "resize", "transform", "position"],
    text: `translate([x, y, z]) children — moves geometry.
rotate([x, y, z]) children — degrees per axis, applied X then Y then Z. rotate(a, v) rotates a degrees around axis v.
scale([x, y, z]) children — scale factors. scale(2) scales uniformly.
mirror([1, 0, 0]) children — mirrors across the plane whose normal is the vector.
Transforms stack: translate([0,0,10]) rotate([90,0,0]) cylinder(...).
Prefer building a module that models one part at the origin, then placing it with translate/rotate.`,
  },
  {
    id: "booleans",
    title: "Boolean operations",
    keywords: ["union", "difference", "intersection", "subtract", "cut", "hole", "boolean"],
    text: `union() combines children (this is also the default for a block of statements).
difference() subtracts every child after the first from the first child.
intersection() keeps only the overlap of all children.
A common hole pattern:
difference() {
  cube([40, 40, 10], center = true);
  translate([0, 0, -6]) cylinder(h = 12, d = 8, $fn = 48);
}
Keep the subtracting shape slightly longer than the wall it passes through so the cut is clean.`,
  },
  {
    id: "modules",
    title: "Modules, loops and reuse",
    keywords: ["module", "function", "for", "loop", "reuse", "parameter", "children"],
    text: `module part(width = 20, thickness = 3) { cube([width, thickness, 10]); }
Call it: part(width = 40);
for (i = [0 : 3]) translate([i * 22, 0, 0]) part();
for (x = [0, 1], y = [0, 1]) translate([x * 20, y * 20, 0]) cube(5);
Functions return values and cannot create geometry: function slotDepth(t = 3) = t * 1.5;
Use modules for repeated geometry, and put every dimension that a user might change in a variable at the top of the file.`,
  },
  {
    id: "parametric-style",
    title: "Parametric style rules",
    keywords: ["parametric", "parameter", "variable", "top", "naming", "customizer"],
    text: `SCADman conventions for generated models:
1. Put all user-facing dimensions at the top as plain assignments with comments and units.
2. Name variables for what they measure: wall_thickness, inner_width, hole_diameter, tray_count.
3. Derive dependent values instead of duplicating: inner_width = width - 2 * wall_thickness;
4. Wrap the model in one module named build() and call it at the end.
5. Never hardcode a magic number inside a transform that a user might want to change.
6. Prefer a small number of meaningful parameters over dozens of micro-tweaks.
7. Keep the code printable: no zero-thickness walls, no self-intersecting solids.`,
  },
  {
    id: "printing",
    title: "3D printing design guidelines",
    keywords: ["print", "wall", "layer", "nozzle", "overhang", "tolerance", "infill", "clearance", "support", "filament"],
    text: `Wall thickness should be a multiple of the extrusion width (nozzle * 1.05..1.2): 0.4 mm nozzle -> 1.2 mm or 1.6 mm walls.
Minimum feature size is about two extrusion widths; below that features print weak or vanish.
Vertical hole clearance: add 0.2-0.4 mm to a hole for a loose fit, 0.1-0.2 mm for a press fit.
Horizontal gaps between separate parts: 0.3-0.5 mm so they do not fuse.
Overhangs beyond 45 degrees from vertical need support material; add a chamfer instead where possible.
Bridge spans over about 15-20 mm sag; split them or add a support rib.
Lid and box fits: 0.3 mm clearance for a sliding lid, 0.15 mm for a snap fit.
Bed adhesion: a 2-3 mm chamfer beats a sharp bottom edge for warping-prone materials.
Infill above 40% rarely adds usable strength; add walls or ribs instead.
PLA: 200-215 C nozzle, 55-60 C bed. PETG: 230-245 C nozzle, 75-85 C bed, slower first layer.`,
  },
  {
    id: "errors",
    title: "Common errors and fixes",
    keywords: ["error", "warning", "unknown", "undefined", "syntax", "missing", "expected", "empty"],
    text: `"Unknown variable" — a variable is used before it is assigned, or its name is misspelled.
"Expected ;" — a statement is missing a semicolon, usually the line before the reported one.
Empty result — 2D primitives were never extruded, or a difference() subtracted the whole model.
Geometry not visible — the model is far from the origin; recentre it or check the transforms.
Zero-thickness walls — two cuts at exactly the same coordinate; offset them by at least 0.01 mm.
Self-intersecting difference — the subtracting child must be a closed solid that fully crosses the wall.`,
  },
  {
    id: "exports",
    title: "Exports and print preparation",
    keywords: ["stl", "3mf", "export", "gcode", "slice", "colour", "color change", "nozzle", "infill"],
    text: `STL carries geometry only. 3MF can carry units, multiple objects and colour/material assignments.
G-code is produced by a slicer, not by OpenSCAD: layer height, infill, supports, temperatures, and filament
colour changes all live in the slicer profile. A colour change is a slicer pause at a layer height.
SCADman stores print profiles (nozzle, filament, layer height, infill, supports, colour changes) and shows
recommendations, but it does not slice: no G-code is produced until a slicer service is connected.`,
  },
];

const STOP = new Set(["the", "a", "an", "and", "or", "of", "to", "for", "with", "in", "on", "it", "is", "i", "my", "me", "make", "create", "add", "please", "can", "you", "that", "this", "be", "so"]);

function terms(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9$_\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export function retrieveKnowledge(query, limit = 4) {
  const words = terms(query);
  if (words.length === 0) return CHUNKS.slice(0, 2);
  const scored = CHUNKS.map((chunk) => {
    const haystack = `${chunk.title} ${chunk.text} ${chunk.keywords.join(" ")}`.toLowerCase();
    let score = 0;
    for (const word of words) {
      if (chunk.keywords.includes(word)) score += 3;
      else if (haystack.includes(word)) score += 1;
    }
    return { chunk, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) return CHUNKS.slice(0, 2);
  return scored.slice(0, limit).map((entry) => entry.chunk);
}

export const KNOWLEDGE_STATUS = {
  status: "curated-local",
  label: "Curated reference",
  detail: "Hand-written OpenSCAD + printing reference retrieved per request. Not a trained model.",
  sources: CHUNKS.map((c) => c.title),
};

export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "Short explanation for the user, 2-5 sentences, plain text." },
    title: { type: "string", description: "A short model name, 2-5 words." },
    code: { type: "string", description: "The complete, final OpenSCAD source for the whole model." },
    parameters: {
      type: "array",
      description: "User-facing parameters that exist as variables in the code.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          label: { type: "string" },
          type: { type: "string", description: "number | integer | boolean | select | text" },
          default_value: { type: "string" },
          min_value: { type: "number" },
          max_value: { type: "number" },
          unit: { type: "string" },
          options: { type: "array", items: { type: "string" } },
        },
        required: ["name", "label", "type", "default_value"],
      },
    },
    assumptions: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
  },
  required: ["reply", "code"],
};

export function buildPrompt({ request, code, history, parameters, diagnostics, knowledge }) {
  const sections = [];

  sections.push(`You are SCADman's OpenSCAD engineer. You write correct, printable, parametric OpenSCAD.

Rules:
- Always return the COMPLETE final OpenSCAD source in "code", never a fragment, never a description instead of code.
- Keep user-facing dimensions as variables at the top of the file, with comments.
- Wrap the model in one module named build() and call build(); at the end.
- Use meaningful names, derive dependent values, avoid magic numbers inside transforms.
- When modifying an existing model, preserve every part of the existing geometry the user did not ask to change.
- Respect dimensions the user gave exactly. State real assumptions in "assumptions".
- Report likely print problems (too thin walls, unsupported overhangs, zero-thickness, unprintable gaps) in "warnings".
- Only list parameters in "parameters" that really exist as variables in the code you returned, with sensible min/max.
- Do not use import(), include(), use(), surface(), or external files: the code must be self-contained.
- Never claim the model was compiled, sliced, or exported. You only produce source.
- Keep "reply" short and concrete: what you built, what changed, what to check.`);

  if (knowledge && knowledge.length) {
    sections.push(
      `REFERENCE MATERIAL (retrieved from the app's curated OpenSCAD and 3D-printing reference):\n\n` +
        knowledge.map((k) => `### ${k.title}\n${k.text}`).join("\n\n")
    );
  }

  if (parameters && parameters.length) {
    sections.push(
      `CURRENT PARAMETERS (structured):\n` +
        parameters
          .map((p) => `- ${p.name} = ${p.default_value}${p.unit ? " " + p.unit : ""} (${p.type})`)
          .join("\n")
    );
  }

  if (code && code.trim()) {
    sections.push(`CURRENT SOURCE CODE (this is the project's real source; modify it in place):\n\`\`\`openscad\n${code}\n\`\`\``);
  } else {
    sections.push("CURRENT SOURCE CODE: the project is empty. Create a new model from scratch.");
  }

  if (diagnostics && diagnostics.length) {
    sections.push(
      "COMPILER DIAGNOSTICS from the built-in preview engine (fix these if they are real problems):\n" +
        diagnostics.map((d) => `- [${d.severity}] ${d.message}`).join("\n")
    );
  }

  if (history && history.length) {
    sections.push(
      "CONVERSATION SO FAR:\n" +
        history
          .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
          .join("\n")
    );
  }

  sections.push(`USER REQUEST:\n${request}`);

  return sections.join("\n\n");
}