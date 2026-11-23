// Built-in OpenSCAD subset interpreter.
//
// This is an honest preview engine: it tokenizes and evaluates a practical subset of the
// OpenSCAD language and emits real triangle meshes from the source you wrote. It is NOT the
// official OpenSCAD compiler, and it does not perform CSG boolean math — difference() children
// are returned as separate "cut" solids so the viewport can draw them as outlines.
//
// The interface is stable so a real engine (OpenSCAD CLI / WASM) can replace it:
//   compileScad(source) -> { engine, ok, solids, diagnostics, stats }

export const ENGINE_ID = "builtin-subset";

class ParseError extends Error {
  constructor(message, line) {
    super(message);
    this.line = line || 0;
  }
}

/* ------------------------------- tokenizer ------------------------------- */

function tokenize(src) {
  const out = [];
  let i = 0;
  let line = 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "\n") { line++; i++; continue; }
    if (c === " " || c === "\t" || c === "\r") { i++; continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) { if (src[i] === "\n") line++; i++; }
      i += 2;
      continue;
    }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
      const start = i;
      while (i < src.length && /[0-9.]/.test(src[i])) i++;
      if (src[i] === "e" || src[i] === "E") {
        i++;
        if (src[i] === "+" || src[i] === "-") i++;
        while (i < src.length && /[0-9]/.test(src[i])) i++;
      }
      out.push({ k: "num", v: src.slice(start, i), n: parseFloat(src.slice(start, i)), line });
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      const start = i;
      while (i < src.length && /[A-Za-z0-9_$]/.test(src[i])) i++;
      out.push({ k: "id", v: src.slice(start, i), line });
      continue;
    }
    if (c === '"') {
      const start = ++i;
      while (i < src.length && src[i] !== '"') { if (src[i] === "\\") i++; i++; }
      out.push({ k: "str", v: src.slice(start, i), line });
      i++;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (["<=", ">=", "==", "!=", "&&", "||"].includes(two)) { out.push({ k: "op", v: two, line }); i += 2; continue; }
    out.push({ k: "op", v: c, line });
    i++;
  }
  return out;
}

/* --------------------------------- matrix -------------------------------- */

const IDENT = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function mul(a, b) {
  const o = new Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      o[r * 4 + c] =
        a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c] + a[r * 4 + 3] * b[12 + c];
    }
  }
  return o;
}

function applyMatrix(m, p) {
  return [
    m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3],
    m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7],
    m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11],
  ];
}

const rad = (d) => (d * Math.PI) / 180;

const translateM = (v) => [1, 0, 0, v[0], 0, 1, 0, v[1], 0, 0, 1, v[2], 0, 0, 0, 1];
const scaleM = (s) => [s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, 0, 0, 0, 1];

function rotX(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1];
}
function rotY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1];
}
function rotZ(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function axisAngleM(v, a) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  const x = v[0] / len, y = v[1] / len, z = v[2] / len;
  const c = Math.cos(a), s = Math.sin(a), t = 1 - c;
  return [
    t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0,
    t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0,
    t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0,
    0, 0, 0, 1,
  ];
}

function mirrorM(n) {
  const len = Math.hypot(n[0], n[1], n[2]) || 1;
  const x = n[0] / len, y = n[1] / len, z = n[2] / len;
  return [
    1 - 2 * x * x, -2 * x * y, -2 * x * z, 0,
    -2 * x * y, 1 - 2 * y * y, -2 * y * z, 0,
    -2 * x * z, -2 * y * z, 1 - 2 * z * z, 0,
    0, 0, 0, 1,
  ];
}

/* ------------------------------- primitives ------------------------------ */

function cubeGeom(size, center) {
  const [sx, sy, sz] = size;
  const x0 = center ? -sx / 2 : 0;
  const y0 = center ? -sy / 2 : 0;
  const z0 = center ? -sz / 2 : 0;
  const x1 = x0 + sx, y1 = y0 + sy, z1 = z0 + sz;
  const verts = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
  ];
  const faces = [
    [0, 2, 1], [0, 3, 2],
    [4, 5, 6], [4, 6, 7],
    [0, 1, 5], [0, 5, 4],
    [2, 3, 7], [2, 7, 6],
    [1, 2, 6], [1, 6, 5],
    [3, 0, 4], [3, 4, 7],
  ];
  return { verts, faces };
}

function sphereGeom(r, segs, rings) {
  const verts = [];
  const faces = [];
  for (let i = 0; i <= rings; i++) {
    const phi = (Math.PI * i) / rings;
    for (let j = 0; j <= segs; j++) {
      const theta = (2 * Math.PI * j) / segs;
      verts.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ]);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j;
      const b = a + segs + 1;
      faces.push([a, b, a + 1], [a + 1, b, b + 1]);
    }
  }
  return { verts, faces };
}

function cylinderGeom(h, r1, r2, center, segs) {
  const z0 = center ? -h / 2 : 0;
  const z1 = z0 + h;
  const verts = [];
  const faces = [];
  for (let j = 0; j < segs; j++) {
    const t = (2 * Math.PI * j) / segs;
    verts.push([r1 * Math.cos(t), r1 * Math.sin(t), z0]);
    verts.push([r2 * Math.cos(t), r2 * Math.sin(t), z1]);
  }
  for (let j = 0; j < segs; j++) {
    const a = j * 2;
    const b = ((j + 1) % segs) * 2;
    faces.push([a, b, a + 1], [a + 1, b, b + 1]);
  }
  const cBot = verts.length;
  verts.push([0, 0, z0]);
  const cTop = verts.length;
  verts.push([0, 0, z1]);
  for (let j = 0; j < segs; j++) {
    const a = j * 2;
    const b = ((j + 1) % segs) * 2;
    faces.push([cBot, b, a]);
    faces.push([cTop, a + 1, b + 1]);
  }
  return { verts, faces };
}

function polyhedronGeom(points, faces) {
  const verts = points.map((p) => [Number(p[0]) || 0, Number(p[1]) || 0, Number(p[2]) || 0]);
  const tris = [];
  for (const f of faces || []) {
    if (!Array.isArray(f) || f.length < 3) continue;
    for (let i = 1; i + 1 < f.length; i++) tris.push([f[0], f[i], f[i + 1]]);
  }
  return { verts, faces: tris };
}

/* -------------------------------- helpers -------------------------------- */

const truthy = (v) => {
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.length > 0;
  return Boolean(v);
};

const numOf = (v) => (typeof v === "number" ? v : Number(v) || 0);

function toArray(v) {
  if (Array.isArray(v)) return v;
  if (v === undefined || v === null) return [];
  return [v];
}

function toVec3(v, fallback) {
  if (Array.isArray(v)) return [numOf(v[0]), numOf(v[1] !== undefined ? v[1] : v[0]), numOf(v[2] !== undefined ? v[2] : v[0])];
  if (typeof v === "number") return [v, v, v];
  return fallback;
}

function elem(a, b, fn) {
  if (Array.isArray(a) || Array.isArray(b)) {
    const A = toArray(a), B = toArray(b);
    const n = Math.max(A.length, B.length);
    const out = [];
    for (let i = 0; i < n; i++) out.push(fn(numOf(A[i]), numOf(B[i])));
    return out;
  }
  return fn(numOf(a), numOf(b));
}

const deepEq = (a, b) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEq(a[i], b[i])) return false;
    return true;
  }
  return a === b;
};

const FUNCS = {
  sin: (a) => Math.sin(rad(a)),
  cos: (a) => Math.cos(rad(a)),
  tan: (a) => Math.tan(rad(a)),
  asin: (a) => (Math.asin(a) * 180) / Math.PI,
  acos: (a) => (Math.acos(a) * 180) / Math.PI,
  atan: (a) => (Math.atan(a) * 180) / Math.PI,
  atan2: (a, b) => (Math.atan2(a, b) * 180) / Math.PI,
  abs: Math.abs,
  ceil: Math.ceil,
  floor: Math.floor,
  round: Math.round,
  sqrt: Math.sqrt,
  exp: Math.exp,
  ln: Math.log,
  log: (a) => Math.log10(a),
  sign: Math.sign,
  pow: Math.pow,
  min: (...a) => Math.min(...a.map(numOf)),
  max: (...a) => Math.max(...a.map(numOf)),
  norm: (v) => Math.hypot(...toArray(v).map(numOf)),
  len: (v) => (Array.isArray(v) ? v.length : typeof v === "string" ? v.length : 0),
  str: (...a) => a.map((x) => (Array.isArray(x) ? x.join("") : String(x))).join(""),
  concat: (...a) => a.flatMap(toArray),
};

/* ------------------------------ interpreter ------------------------------ */

class Interpreter {
  constructor(toks, diags) {
    this.toks = toks;
    this.pos = 0;
    this.diags = diags;
    this.scopes = [new Map()];
    this.modules = new Map();
    this.mats = [IDENT];
    this.op = "add";
    this.buffers = { add: { pos: [], idx: [] }, cut: { pos: [], idx: [] } };
    this.objects = 0;
    this.bbox = null;
    this.warned = new Set();
    this.lastLine = 1;
    this.mode = "3d";
    this.polys2d = [];
  }

  /* ---------- token helpers ---------- */
  peek(k = 0) { return this.toks[this.pos + k]; }
  isOp(v, k = 0) { const t = this.peek(k); return !!t && t.k === "op" && t.v === v; }
  isId(v, k = 0) { const t = this.peek(k); return !!t && t.k === "id" && t.v === v; }
  expectOp(v) {
    const t = this.peek();
    if (!t || t.k !== "op" || t.v !== v) {
      throw new ParseError(`Expected "${v}"`, t ? t.line : this.lastLine);
    }
    this.pos++;
  }
  warn(message, line) {
    const key = message + ":" + (line || 0);
    if (this.warned.has(key)) return;
    this.warned.add(key);
    this.diags.push({ severity: "warning", message, line: line || undefined });
  }

  /* ---------- variables ---------- */
  getVar(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name)) return this.scopes[i].get(name);
    }
    if (name === "$fn") return 0;
    if (name === "$fa") return 12;
    if (name === "$fs") return 2;
    if (name === "PI") return Math.PI;
    if (name === "true") return true;
    if (name === "false") return false;
    return undefined;
  }
  setVar(name, value) { this.scopes[this.scopes.length - 1].set(name, value); }

  /* ---------- expressions ---------- */
  expr() { return this.ternary(); }

  ternary() {
    const cond = this.logicOr();
    if (this.isOp("?")) {
      this.pos++;
      const a = this.expr();
      this.expectOp(":");
      const b = this.expr();
      return truthy(cond) ? a : b;
    }
    return cond;
  }
  logicOr() {
    let left = this.logicAnd();
    while (this.isOp("||")) { this.pos++; const r = this.logicAnd(); left = truthy(left) || truthy(r); }
    return left;
  }
  logicAnd() {
    let left = this.equality();
    while (this.isOp("&&")) { this.pos++; const r = this.equality(); left = truthy(left) && truthy(r); }
    return left;
  }
  equality() {
    let left = this.comparison();
    while (this.isOp("==") || this.isOp("!=")) {
      const op = this.peek().v;
      this.pos++;
      const right = this.comparison();
      left = op === "==" ? deepEq(left, right) : !deepEq(left, right);
    }
    return left;
  }
  comparison() {
    let left = this.additive();
    while (this.isOp("<") || this.isOp(">") || this.isOp("<=") || this.isOp(">=")) {
      const op = this.peek().v;
      this.pos++;
      const right = this.additive();
      const a = numOf(left), b = numOf(right);
      left = op === "<" ? a < b : op === ">" ? a > b : op === "<=" ? a <= b : a >= b;
    }
    return left;
  }
  additive() {
    let left = this.multiplicative();
    while (this.isOp("+") || this.isOp("-")) {
      const op = this.peek().v;
      this.pos++;
      const right = this.multiplicative();
      left = op === "+" ? elem(left, right, (a, b) => a + b) : elem(left, right, (a, b) => a - b);
    }
    return left;
  }
  multiplicative() {
    let left = this.unary();
    while (this.isOp("*") || this.isOp("/") || this.isOp("%")) {
      const op = this.peek().v;
      this.pos++;
      const right = this.unary();
      left = elem(left, right, (a, b) => (op === "*" ? a * b : op === "/" ? a / b : a % b));
    }
    return left;
  }
  unary() {
    if (this.isOp("-")) { this.pos++; const v = this.unary(); return elem(v, 0, (a) => -a); }
    if (this.isOp("+")) { this.pos++; return this.unary(); }
    if (this.isOp("!")) { this.pos++; return !truthy(this.unary()); }
    return this.postfix();
  }
  postfix() {
    let value = this.primary();
    while (this.isOp("[")) {
      this.pos++;
      const index = Math.trunc(numOf(this.expr()));
      this.expectOp("]");
      value = Array.isArray(value) ? value[index] : undefined;
    }
    return value;
  }
  primary() {
    const t = this.peek();
    if (!t) throw new ParseError("Unexpected end of source", this.lastLine);
    this.lastLine = t.line;
    if (t.k === "num") { this.pos++; return t.n; }
    if (t.k === "str") { this.pos++; return t.v; }
    if (t.k === "op" && t.v === "(") { this.pos++; const v = this.expr(); this.expectOp(")"); return v; }
    if (t.k === "op" && t.v === "[") return this.arrayLiteral();
    if (t.k === "id") {
      this.pos++;
      if (t.v === "true") return true;
      if (t.v === "false") return false;
      if (t.v === "undef") return undefined;
      if (this.isOp("(")) {
        const args = this.argList();
        return this.callValue(t.v, args, t.line);
      }
      const value = this.getVar(t.v);
      if (value === undefined) throw new ParseError(`Unknown variable "${t.v}"`, t.line);
      return value;
    }
    throw new ParseError(`Unexpected "${t.v}"`, t.line);
  }
  arrayLiteral() {
    this.expectOp("[");
    if (this.isOp("]")) { this.pos++; return []; }
    const first = this.expr();
    if (this.isOp(":")) {
      this.pos++;
      const second = numOf(this.expr());
      let step = 1;
      let end = second;
      if (this.isOp(":")) { this.pos++; step = second; end = numOf(this.expr()); }
      this.expectOp("]");
      const out = [];
      if (step === 0) return out;
      for (let v = numOf(first); step > 0 ? v <= end + 1e-9 : v >= end - 1e-9; v += step) {
        out.push(v);
        if (out.length > 20000) break;
      }
      return out;
    }
    const out = [first];
    while (this.isOp(",")) {
      this.pos++;
      if (this.isOp("]")) break;
      out.push(this.expr());
    }
    this.expectOp("]");
    return out;
  }
  argList() {
    this.expectOp("(");
    const positional = [];
    const named = {};
    while (!this.isOp(")")) {
      const t = this.peek();
      if (!t) throw new ParseError("Unclosed argument list", this.lastLine);
      if (t.k === "id" && this.isOp("=", 1)) {
        this.pos += 2;
        named[t.v] = this.expr();
      } else {
        positional.push(this.expr());
      }
      if (this.isOp(",")) { this.pos++; continue; }
      if (!this.isOp(")")) throw new ParseError("Expected , or ) in arguments", t.line);
    }
    this.expectOp(")");
    return { positional, named };
  }
  callValue(name, args, line) {
    const fn = FUNCS[name];
    if (!fn) throw new ParseError(`Unknown function "${name}()"`, line);
    const values = args.positional.slice();
    for (const key of Object.keys(args.named)) values.push(args.named[key]);
    return fn(...values);
  }

  /* ---------- statements ---------- */
  run() {
    while (this.pos < this.toks.length) {
      const t = this.peek();
      if (t.k === "op" && t.v === "}") return;
      const before = this.pos;
      this.statement();
      if (this.pos === before) this.pos++;
    }
  }

  statement() {
    const t = this.peek();
    if (!t) return;
    this.lastLine = t.line;
    if (t.k === "op") {
      if (t.v === ";") { this.pos++; return; }
      if (t.v === "{") {
        this.pos++;
        this.scopes.push(new Map());
        this.run();
        this.scopes.pop();
        this.expectOp("}");
        return;
      }
      throw new ParseError(`Unexpected "${t.v}"`, t.line);
    }
    if (t.k !== "id") throw new ParseError("Unexpected token", t.line);

    if (t.v === "module") return this.moduleDef();
    if (t.v === "function") {
      this.warn("function declarations are not evaluated by the built-in preview", t.line);
      return this.skipStatement();
    }
    if (t.v === "if") return this.ifStmt();
    if (t.v === "for") return this.forStmt();
    if (t.v === "include" || t.v === "use") {
      this.warn(`"${t.v}" files are not resolved by the built-in preview`, t.line);
      return this.skipStatement();
    }
    if (t.v === "echo") { this.pos++; this.argList(); if (this.isOp(";")) this.pos++; return; }
    if (this.isOp("=", 1)) {
      const name = t.v;
      this.pos += 2;
      const value = this.expr();
      this.setVar(name, value);
      if (this.isOp(";")) this.pos++;
      return;
    }
    return this.instantiate();
  }

  moduleDef() {
    this.pos++;
    const nameTok = this.peek();
    if (!nameTok || nameTok.k !== "id") throw new ParseError("Expected module name", nameTok ? nameTok.line : this.lastLine);
    const name = nameTok.v;
    this.pos++;
    const params = [];
    if (this.isOp("(")) {
      this.pos++;
      while (!this.isOp(")")) {
        const p = this.peek();
        if (!p) throw new ParseError("Unclosed module parameters", this.lastLine);
        if (p.k === "id") {
          this.pos++;
          let def;
          if (this.isOp("=")) { this.pos++; def = this.expr(); }
          params.push({ name: p.v, def });
        } else {
          this.pos++;
        }
        if (this.isOp(",")) this.pos++;
      }
      this.expectOp(")");
    }
    this.expectOp("{");
    const start = this.pos;
    let depth = 1;
    while (this.pos < this.toks.length) {
      const tk = this.peek();
      if (tk.k === "op" && tk.v === "{") depth++;
      if (tk.k === "op" && tk.v === "}") {
        depth--;
        if (depth === 0) break;
      }
      this.pos++;
    }
    const end = this.pos;
    this.modules.set(name, { params, start, end });
    this.pos++;
  }

  skipStatement() {
    const t = this.peek();
    if (!t) return;
    if (t.k === "op" && t.v === "{") { this.skipBlock(); return; }
    if (t.k === "id" && t.v === "if") { this.pos++; if (this.isOp("(")) this.skipParens(); this.skipChild(); if (this.isId("else")) { this.pos++; this.skipChild(); } return; }
    if (t.k === "id" && t.v === "for") { this.pos++; if (this.isOp("(")) this.skipParens(); this.skipChild(); return; }
    while (this.pos < this.toks.length) {
      const tk = this.peek();
      if (tk.k === "op" && tk.v === ";") { this.pos++; return; }
      if (tk.k === "op" && tk.v === "}") return;
      this.pos++;
    }
  }
  skipBlock() {
    let depth = 0;
    while (this.pos < this.toks.length) {
      const tk = this.peek();
      if (tk.k === "op" && tk.v === "{") depth++;
      if (tk.k === "op" && tk.v === "}") {
        depth--;
        this.pos++;
        if (depth === 0) return;
        continue;
      }
      this.pos++;
    }
  }
  skipParens() {
    let depth = 0;
    while (this.pos < this.toks.length) {
      const tk = this.peek();
      if (tk.k === "op" && tk.v === "(") depth++;
      if (tk.k === "op" && tk.v === ")") { depth--; this.pos++; if (depth === 0) return; continue; }
      this.pos++;
    }
  }
  skipChild() {
    const t = this.peek();
    if (!t) return;
    if (t.k === "op" && t.v === ";") { this.pos++; return; }
    if (t.k === "op" && t.v === "{") { this.skipBlock(); return; }
    this.skipStatement();
  }

  childWithOp(op) {
    const prev = this.op;
    this.op = op;
    try {
      const t = this.peek();
      if (!t) return;
      if (t.k === "op" && t.v === ";") { this.pos++; return; }
      this.statement();
    } finally {
      this.op = prev;
    }
  }

  runChildrenOps(opForIndex) {
    const t = this.peek();
    if (!t) return;
    if (t.k === "op" && t.v === ";") { this.pos++; return; }
    if (t.k === "op" && t.v === "{") {
      this.pos++;
      this.scopes.push(new Map());
      let i = 0;
      while (this.pos < this.toks.length && !(this.peek().k === "op" && this.peek().v === "}")) {
        const before = this.pos;
        this.childWithOp(opForIndex(i));
        i++;
        if (this.pos === before) this.pos++;
      }
      if (this.isOp("}")) this.pos++;
      this.scopes.pop();
      return;
    }
    this.childWithOp(opForIndex(0));
  }

  ifStmt() {
    this.pos++;
    this.expectOp("(");
    const cond = truthy(this.expr());
    this.expectOp(")");
    if (cond) this.childWithOp(this.op);
    else this.skipChild();
    if (this.isId("else")) {
      this.pos++;
      if (cond) this.skipChild();
      else this.childWithOp(this.op);
    }
  }

  forStmt() {
    this.pos++;
    this.expectOp("(");
    const binds = [];
    for (;;) {
      const nameTok = this.peek();
      if (!nameTok || nameTok.k !== "id") throw new ParseError("Expected loop variable", nameTok ? nameTok.line : this.lastLine);
      this.pos++;
      this.expectOp("=");
      binds.push({ name: nameTok.v, values: toArray(this.expr()) });
      if (this.isOp(",")) { this.pos++; continue; }
      break;
    }
    this.expectOp(")");

    const childStart = this.pos;
    const total = binds.reduce((n, b) => n * Math.max(1, b.values.length), 1);
    if (binds.some((b) => b.values.length === 0)) {
      this.skipChild();
      return;
    }
    if (total > 2000) {
      this.warn(`Loop of ${total} iterations truncated to 2000 in the preview`, this.lastLine);
      this.skipChild();
      return;
    }
    const iterate = (index, scope) => {
      if (index === binds.length) {
        this.scopes.push(scope);
        this.pos = childStart;
        this.childWithOp(this.op);
        this.scopes.pop();
        return;
      }
      for (const value of binds[index].values) {
        const next = new Map(scope);
        next.set(binds[index].name, value);
        iterate(index + 1, next);
      }
    };
    iterate(0, new Map());
  }

  /* ---------- geometry ---------- */
  currentMatrix() { return this.mats[this.mats.length - 1]; }

  withMatrix(m, fn) {
    this.mats.push(mul(this.currentMatrix(), m));
    try { fn(); } finally { this.mats.pop(); }
  }

  extendBBox(p) {
    if (!this.bbox) {
      this.bbox = { min: [p[0], p[1], p[2]], max: [p[0], p[1], p[2]] };
      return;
    }
    for (let i = 0; i < 3; i++) {
      if (p[i] < this.bbox.min[i]) this.bbox.min[i] = p[i];
      if (p[i] > this.bbox.max[i]) this.bbox.max[i] = p[i];
    }
  }

  emitPoly(points, line) {
    if (this.mode !== "2d") {
      this.warn("A 2D shape needs linear_extrude() or rotate_extrude() to become a solid", line);
      return;
    }
    const m = this.currentMatrix();
    const projected = points.map((p) => {
      const q = applyMatrix(m, [p[0], p[1], 0]);
      return [q[0], q[1]];
    });
    if (projected.length >= 3) this.polys2d.push({ points: projected });
  }

  collectPolys(fn) {
    const outerMats = this.mats;
    const prevMode = this.mode;
    const prevPolys = this.polys2d;
    this.mats = [IDENT];
    this.mode = "2d";
    this.polys2d = [];
    let collected = [];
    try {
      fn();
      collected = this.polys2d;
    } finally {
      this.mats = outerMats;
      this.mode = prevMode;
      this.polys2d = prevPolys;
    }
    return collected;
  }

  emitPrism(poly, height, center, scaleFactor) {
    const pts = poly.points;
    const n = pts.length;
    const z0 = center ? -height / 2 : 0;
    const z1 = z0 + height;
    const verts = [];
    for (const p of pts) verts.push([p[0], p[1], z0]);
    for (const p of pts) verts.push([p[0] * scaleFactor, p[1] * scaleFactor, z1]);
    const faces = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      faces.push([i, j, n + j], [i, n + j, n + i]);
    }
    let cx = 0;
    let cy = 0;
    for (const p of pts) { cx += p[0]; cy += p[1]; }
    cx /= n;
    cy /= n;
    const cBot = verts.length;
    verts.push([cx, cy, z0]);
    const cTop = verts.length;
    verts.push([cx * scaleFactor, cy * scaleFactor, z1]);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      faces.push([cBot, j, i]);
      faces.push([cTop, n + i, n + j]);
    }
    this.emit({ verts, faces });
  }

  emitRevolution(poly, angleDeg, segs) {
    const pts = poly.points;
    const n = pts.length;
    const total = rad(angleDeg);
    const verts = [];
    const rows = [];
    for (let s = 0; s <= segs; s++) {
      const a = (total * s) / segs;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const row = [];
      for (const p of pts) {
        row.push(verts.length);
        verts.push([p[0] * cos, p[0] * sin, p[1]]);
      }
      rows.push(row);
    }
    const faces = [];
    for (let s = 0; s < segs; s++) {
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const a0 = rows[s][i];
        const b0 = rows[s][j];
        const a1 = rows[s + 1][i];
        const b1 = rows[s + 1][j];
        faces.push([a0, b0, b1], [a0, b1, a1]);
      }
    }
    if (Math.abs(angleDeg) < 359.9) {
      const first = rows[0];
      for (let i = 1; i + 1 < n; i++) faces.push([first[0], first[i], first[i + 1]]);
      const last = rows[rows.length - 1];
      for (let i = 1; i + 1 < n; i++) faces.push([last[0], last[i + 1], last[i]]);
    }
    this.emit({ verts, faces });
  }

  emit(geom) {
    if (this.mode === "2d") {
      this.warn("3D shapes inside an extrude are ignored by the built-in preview", this.lastLine);
      return;
    }
    const m = this.currentMatrix();
    const buf = this.buffers[this.op];
    const base = buf.pos.length / 3;
    for (const v of geom.verts) {
      const p = applyMatrix(m, v);
      buf.pos.push(p[0], p[1], p[2]);
      if (this.op === "add") this.extendBBox(p);
    }
    for (const f of geom.faces) {
      for (let i = 1; i + 1 < f.length; i++) buf.idx.push(base + f[0], base + f[i], base + f[i + 1]);
    }
    this.objects++;
  }

  segments(defaultSegs = 24, args = null) {
    const named = args && args.named ? args.named : {};
    const direct = typeof named["$fn"] === "number" ? named["$fn"] : 0;
    if (direct >= 3) return Math.max(3, Math.min(160, Math.round(direct)));
    const fn = numOf(this.getVar("$fn"));
    if (fn >= 3) return Math.max(3, Math.min(160, Math.round(fn)));
    return defaultSegs;
  }

  instantiate() {
    const tok = this.peek();
    const name = tok.v;
    const line = tok.line;
    this.pos++;
    const args = this.isOp("(") ? this.argList() : { positional: [], named: {} };
    this.callNode(name, args, line);
  }

  callNode(name, args, line) {
    const arg = (index, keys) => {
      for (const key of keys) if (args.named[key] !== undefined) return args.named[key];
      return args.positional[index];
    };
    const numArg = (index, keys, def) => {
      const v = arg(index, keys);
      return typeof v === "number" ? v : def;
    };

    // user modules
    const mod = this.modules.get(name);
    if (mod) {
      const savedPos = this.pos;
      const scope = new Map();
      mod.params.forEach((param, index) => {
        const passed = args.named[param.name] !== undefined ? args.named[param.name] : args.positional[index];
        scope.set(param.name, passed !== undefined ? passed : param.def);
      });
      this.scopes.push(scope);
      this.pos = mod.start;
      this.run();
      this.pos = mod.end;
      this.scopes.pop();
      this.pos = savedPos;
      this.skipChild();
      return;
    }

    switch (name) {
      case "translate": {
        const v = toVec3(arg(0, ["v"]), [0, 0, 0]);
        this.withMatrix(translateM(v), () => this.runChildrenOps(() => this.op));
        return;
      }
      case "rotate": {
        const a = arg(0, ["a"]);
        const axis = arg(1, ["v"]);
        let m;
        if (Array.isArray(a)) {
          m = mul(rotX(rad(numOf(a[0]))), mul(rotY(rad(numOf(a[1]))), rotZ(rad(numOf(a[2])))));
        } else if (Array.isArray(axis)) {
          m = axisAngleM(axis, rad(numOf(a)));
        } else {
          m = rotZ(rad(numOf(a)));
        }
        this.withMatrix(m, () => this.runChildrenOps(() => this.op));
        return;
      }
      case "scale": {
        const v = arg(0, ["v"]);
        const s = Array.isArray(v)
          ? [numOf(v[0] !== undefined ? v[0] : 1), numOf(v[1] !== undefined ? v[1] : 1), numOf(v[2] !== undefined ? v[2] : 1)]
          : [numOf(v), numOf(v), numOf(v)];
        this.withMatrix(scaleM(s), () => this.runChildrenOps(() => this.op));
        return;
      }
      case "mirror": {
        const v = toVec3(arg(0, ["v"]), [1, 0, 0]);
        this.withMatrix(mirrorM(v), () => this.runChildrenOps(() => this.op));
        return;
      }
      case "color":
      case "render":
      case "group":
      case "union": {
        this.runChildrenOps(() => this.op);
        return;
      }
      case "difference": {
        this.runChildrenOps((i) => (i === 0 ? this.op : "cut"));
        return;
      }
      case "intersection": {
        this.warn("intersection() is drawn as overlapping solids in the built-in preview", line);
        this.runChildrenOps(() => this.op);
        return;
      }
      case "hull":
      case "minkowski":
      case "offset":
      case "multmatrix": {
        this.warn(`${name}() is not supported by the built-in preview`, line);
        this.runChildrenOps(() => this.op);
        return;
      }
      case "cube": {
        const size = arg(0, ["size"]);
        const center = truthy(arg(1, ["center"]));
        this.emit(cubeGeom(toVec3(size, [1, 1, 1]), center));
        this.skipChild();
        return;
      }
      case "sphere": {
        const d = arg(1, ["d"]);
        const r = typeof arg(0, ["r"]) === "number" ? arg(0, ["r"]) : d !== undefined ? numOf(d) / 2 : 1;
        const segs = this.segments(24, args);
        const rings = Math.max(4, Math.round(segs / 2));
        this.emit(sphereGeom(numOf(r), segs, rings));
        this.skipChild();
        return;
      }
      case "cylinder": {
        const h = numArg(0, ["h"], 1);
        const center = truthy(arg(4, ["center"]));
        const d = arg(1, ["d"]);
        const r = arg(1, ["r"]);
        const r1arg = arg(2, ["r1"]);
        const r2arg = arg(3, ["r2"]);
        const d1 = arg(2, ["d1"]);
        const d2 = arg(3, ["d2"]);
        const base = r !== undefined ? numOf(r) : d !== undefined ? numOf(d) / 2 : 1;
        const r1 = r1arg !== undefined ? numOf(r1arg) : d1 !== undefined ? numOf(d1) / 2 : base;
        const r2 = r2arg !== undefined ? numOf(r2arg) : d2 !== undefined ? numOf(d2) / 2 : base;
        this.emit(cylinderGeom(h, r1, r2, center, this.segments(24, args)));
        this.skipChild();
        return;
      }
      case "polyhedron": {
        const points = arg(0, ["points"]);
        const faces = arg(1, ["faces", "triangles"]);
        if (Array.isArray(points) && Array.isArray(faces)) this.emit(polyhedronGeom(points, faces));
        else this.warn("polyhedron() needs points and faces", line);
        this.skipChild();
        return;
      }
      case "square": {
        const size = toVec3(arg(0, ["size"]), [1, 1, 1]);
        const centered = truthy(arg(1, ["center"]));
        const x0 = centered ? -size[0] / 2 : 0;
        const y0 = centered ? -size[1] / 2 : 0;
        this.emitPoly(
          [[x0, y0], [x0 + size[0], y0], [x0 + size[0], y0 + size[1]], [x0, y0 + size[1]]],
          line
        );
        this.skipChild();
        return;
      }
      case "circle": {
        const d = arg(1, ["d"]);
        const rArg = arg(0, ["r"]);
        const radius = typeof rArg === "number" ? rArg : d !== undefined ? numOf(d) / 2 : 1;
        const segs = this.segments(48, args);
        const pts = [];
        for (let i = 0; i < segs; i++) {
          const t = (2 * Math.PI * i) / segs;
          pts.push([radius * Math.cos(t), radius * Math.sin(t)]);
        }
        this.emitPoly(pts, line);
        this.skipChild();
        return;
      }
      case "polygon": {
        const points = arg(0, ["points"]);
        if (Array.isArray(points)) this.emitPoly(points.map((p) => [numOf(p[0]), numOf(p[1])]), line);
        else this.warn("polygon() needs a points array", line);
        this.skipChild();
        return;
      }
      case "linear_extrude": {
        const height = numArg(0, ["height", "h"], 1);
        const centered = truthy(arg(1, ["center"]));
        const scaleArg = arg(2, ["scale"]);
        const scaleFactor = typeof scaleArg === "number" ? scaleArg : 1;
        const polys = this.collectPolys(() => this.runChildrenOps(() => this.op));
        for (const poly of polys) this.emitPrism(poly, height, centered, scaleFactor);
        return;
      }
      case "rotate_extrude": {
        const angle = numArg(0, ["angle", "a"], 360);
        const polys = this.collectPolys(() => this.runChildrenOps(() => this.op));
        const segs = Math.max(3, Math.round((this.segments(48, args) * Math.min(360, Math.abs(angle))) / 360));
        for (const poly of polys) this.emitRevolution(poly, angle, segs);
        return;
      }
      case "text":
      case "import":
      case "surface":
      case "projection":
      case "offset2d": {
        this.warn(`${name}() is not supported by the built-in preview`, line);
        this.runChildrenOps(() => this.op);
        this.skipChild();
        return;
      }
      case "children": {
        this.warn("children() is not supported by the built-in preview", line);
        this.skipChild();
        return;
      }
      default: {
        this.warn(`Unknown module "${name}()" — skipped in the preview`, line);
        this.runChildrenOps(() => this.op);
        this.skipChild();
        return;
      }
    }
  }
}

/* --------------------------------- public -------------------------------- */

export function compileScad(source) {
  const started = Date.now();
  const diagnostics = [];
  const text = typeof source === "string" ? source : "";

  if (!text.trim()) {
    return {
      engine: ENGINE_ID,
      ok: false,
      solids: [],
      diagnostics: [{ severity: "error", message: "The project has no source code yet.", line: 1 }],
      stats: { triangles: 0, objects: 0, sizeMm: null },
      durationMs: Date.now() - started,
    };
  }

  let interp;
  try {
    interp = new Interpreter(tokenize(text), diagnostics);
    interp.run();
  } catch (error) {
    const line = error && error.line ? error.line : undefined;
    diagnostics.push({
      severity: "error",
      message: error && error.message ? error.message : "Could not parse the source",
      line,
    });
    return {
      engine: ENGINE_ID,
      ok: false,
      solids: [],
      diagnostics,
      stats: { triangles: 0, objects: 0, sizeMm: null },
      durationMs: Date.now() - started,
    };
  }

  const solids = [];
  for (const key of ["add", "cut"]) {
    const buf = interp.buffers[key];
    if (buf.idx.length === 0) continue;
    solids.push({ op: key, positions: buf.pos, indices: buf.idx });
  }

  const triangles = solids.reduce((n, s) => n + s.indices.length / 3, 0);
  const size = interp.bbox
    ? [
        +(interp.bbox.max[0] - interp.bbox.min[0]).toFixed(2),
        +(interp.bbox.max[1] - interp.bbox.min[1]).toFixed(2),
        +(interp.bbox.max[2] - interp.bbox.min[2]).toFixed(2),
      ]
    : null;

  if (triangles === 0) {
    diagnostics.push({
      severity: "warning",
      message: "No geometry was produced. The built-in preview only renders 3D primitives (cube, sphere, cylinder, polyhedron) and transforms.",
    });
  }

  return {
    engine: ENGINE_ID,
    ok: triangles > 0,
    solids,
    diagnostics,
    stats: { triangles, objects: interp.objects, sizeMm: size },
    durationMs: Date.now() - started,
  };
}

export function hashSource(source) {
  const text = typeof source === "string" ? source : "";
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = (h1 ^ c) * 0x01000193;
    h2 = (h2 + c * (i + 7)) % 0x7fffffff;
  }
  return `${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
}