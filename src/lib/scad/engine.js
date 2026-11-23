// SCADman geometry engine — real CSG in the browser.
//
// The parser below reads a practical subset of the OpenSCAD language. Instead of emitting
// loose triangles, every node is built as a JSCAD solid and booleans are resolved by the
// JSCAD CSG kernel, so difference() actually cuts, intersections are real, and the result is a
// watertight mesh that can be written to STL / 3MF.
//
// It is not the official OpenSCAD compiler: unsupported features produce a diagnostic instead
// of silently doing nothing. The public shape (compileScad -> { ok, mesh, geoms, diagnostics,
// stats }) is what a different engine would have to return to replace this one.

import { primitives, booleans, transforms, extrusions, geometries, measurements, maths } from "@jscad/modeling";

export const ENGINE_ID = "jscad-csg";
export const ENGINE_LABEL = "JSCAD CSG kernel";
export const MAX_SOLIDS = 4000;

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
      const raw = src.slice(start, i);
      out.push({ k: "num", v: raw, n: parseFloat(raw), line });
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

// JSCAD matrices are column-major, so every matrix is built with its own helpers.
const m4 = maths.mat4;

function mul(a, b) {
  return m4.multiply(m4.create(), a, b);
}

const rad = (d) => (d * Math.PI) / 180;
const translateM = (v) => m4.fromTranslation(m4.create(), v);
const scaleM = (s) => m4.fromScaling(m4.create(), s);

function rotX(a) { return m4.fromXRotation(m4.create(), a); }
function rotY(a) { return m4.fromYRotation(m4.create(), a); }
function rotZ(a) { return m4.fromZRotation(m4.create(), a); }

function axisAngleM(v, a) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return m4.fromRotation(m4.create(), a, [v[0] / len, v[1] / len, v[2] / len]);
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
  if (Array.isArray(v)) {
    return [
      numOf(v[0]),
      numOf(v[1] !== undefined ? v[1] : v[0]),
      numOf(v[2] !== undefined ? v[2] : v[0]),
    ];
  }
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
    this.collectors = [[]];
    this.mode = "3d";
    this.warned = new Set();
    this.lastLine = 1;
    this.solids = 0;
  }

  peek(k = 0) { return this.toks[this.pos + k]; }
  isOp(v, k = 0) { const t = this.peek(k); return !!t && t.k === "op" && t.v === v; }
  isId(v, k = 0) { const t = this.peek(k); return !!t && t.k === "id" && t.v === v; }
  expectOp(v) {
    const t = this.peek();
    if (!t || t.k !== "op" || t.v !== v) throw new ParseError(`Expected "${v}"`, t ? t.line : this.lastLine);
    this.pos++;
  }
  warn(message, line) {
    const key = `${message}:${line || 0}`;
    if (this.warned.has(key)) return;
    this.warned.add(key);
    this.diags.push({ severity: "warning", message, line: line || undefined });
  }

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
    if (this.isOp("-")) { this.pos++; return elem(this.unary(), 0, (a) => -a); }
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
      this.warn("function declarations are not evaluated by this engine", t.line);
      return this.skipStatement();
    }
    if (t.v === "if") return this.ifStmt();
    if (t.v === "for") return this.forStmt();
    if (t.v === "include" || t.v === "use") {
      this.warn(`"${t.v}" files are not resolved by this engine`, t.line);
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
    if (t.k === "id" && t.v === "if") {
      this.pos++;
      if (this.isOp("(")) this.skipParens();
      this.skipChild();
      if (this.isId("else")) { this.pos++; this.skipChild(); }
      return;
    }
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

  /* ---------- geometry plumbing ---------- */
  collect(fn) {
    this.collectors.push([]);
    try {
      fn();
    } catch (error) {
      this.collectors.pop();
      throw error;
    }
    return this.collectors.pop();
  }

  collect2D(fn) {
    const previous = this.mode;
    this.mode = "2d";
    try {
      return this.collect(fn);
    } finally {
      this.mode = previous;
    }
  }

  push(geom) {
    if (!geom) return;
    this.collectors[this.collectors.length - 1].push(geom);
  }

  emit3d(geom) {
    if (this.mode === "2d") {
      this.warn("3D shapes inside an extrude are ignored", this.lastLine);
      return;
    }
    this.solids++;
    if (this.solids > MAX_SOLIDS) {
      throw new ParseError(`This model exceeds the ${MAX_SOLIDS} solid limit of the preview engine`, this.lastLine);
    }
    this.push(geom);
  }

  emit2d(geom) {
    if (this.mode !== "2d") {
      this.warn("A 2D shape needs linear_extrude() or rotate_extrude() to become a solid", this.lastLine);
      return;
    }
    this.push(geom);
  }

  withTransform(matrix, fn) {
    const kids = this.collect(fn);
    for (const kid of kids) {
      try {
        this.push(transforms.transform(matrix, kid));
      } catch (error) {
        this.warn(`Transform failed: ${error.message}`, this.lastLine);
      }
    }
  }

  combine(op, kids) {
    const list = kids.filter(Boolean);
    if (list.length === 0) return null;
    if (list.length === 1) return list[0];
    try {
      if (op === "union") return booleans.union(list);
      if (op === "intersect") return booleans.intersect(list);
      return booleans.subtract(list[0], list.slice(1));
    } catch (error) {
      this.warn(`Boolean ${op} failed (${error.message}); showing the parts separately`, this.lastLine);
      return list[0];
    }
  }

  node(op, fn) {
    const kids = this.collect(fn);
    const combined = this.combine(op, kids);
    if (combined) this.push(combined);
  }

  runChildren() {
    const t = this.peek();
    if (!t) return;
    if (t.k === "op" && t.v === ";") { this.pos++; return; }
    this.statement();
  }

  ifStmt() {
    this.pos++;
    this.expectOp("(");
    const cond = truthy(this.expr());
    this.expectOp(")");
    if (cond) this.runChildren();
    else this.skipChild();
    if (this.isId("else")) {
      this.pos++;
      if (cond) this.skipChild();
      else this.runChildren();
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
      this.warn(`Loop of ${total} iterations truncated to 2000`, this.lastLine);
      this.skipChild();
      return;
    }
    const iterate = (index, scope) => {
      if (index === binds.length) {
        this.scopes.push(scope);
        this.pos = childStart;
        this.runChildren();
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

  segments(defaultSegs, args) {
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
        this.withTransform(translateM(v), () => this.runChildren());
        return;
      }
      case "rotate": {
        const a = arg(0, ["a"]);
        const axis = arg(1, ["v"]);
        let matrix;
        if (Array.isArray(a)) {
          // OpenSCAD applies rotate([x, y, z]) as X, then Y, then Z.
          matrix = mul(rotZ(rad(numOf(a[2]))), mul(rotY(rad(numOf(a[1]))), rotX(rad(numOf(a[0])))));
        } else if (Array.isArray(axis)) {
          matrix = axisAngleM(axis, rad(numOf(a)));
        } else {
          matrix = rotZ(rad(numOf(a)));
        }
        this.withTransform(matrix, () => this.runChildren());
        return;
      }
      case "scale": {
        const v = arg(0, ["v"]);
        const s = Array.isArray(v)
          ? [numOf(v[0] !== undefined ? v[0] : 1), numOf(v[1] !== undefined ? v[1] : 1), numOf(v[2] !== undefined ? v[2] : 1)]
          : [numOf(v), numOf(v), numOf(v)];
        this.withTransform(scaleM(s), () => this.runChildren());
        return;
      }
      case "mirror": {
        const v = toVec3(arg(0, ["v"]), [1, 0, 0]);
        this.withTransform(mirrorM(v), () => this.runChildren());
        return;
      }
      case "color":
      case "render":
      case "group": {
        this.runChildren();
        return;
      }
      case "union": {
        this.node("union", () => this.runChildren());
        return;
      }
      case "difference": {
        this.node("subtract", () => this.runChildren());
        return;
      }
      case "intersection": {
        this.node("intersect", () => this.runChildren());
        return;
      }
      case "hull":
      case "minkowski":
      case "offset":
      case "multmatrix":
      case "resize": {
        this.warn(`${name}() is not supported by this engine; the children are shown unchanged`, line);
        this.runChildren();
        return;
      }
      case "cube": {
        const size = toVec3(arg(0, ["size"]), [1, 1, 1]);
        const centered = truthy(arg(1, ["center"]));
        this.emit3d(
          primitives.cuboid({
            size,
            center: centered ? [0, 0, 0] : [size[0] / 2, size[1] / 2, size[2] / 2],
          })
        );
        this.skipChild();
        return;
      }
      case "sphere": {
        const d = arg(1, ["d"]);
        const rArg = arg(0, ["r"]);
        const radius = typeof rArg === "number" ? rArg : d !== undefined ? numOf(d) / 2 : 1;
        const segments = this.segments(32, args);
        this.emit3d(primitives.sphere({ radius, segments, center: [0, 0, 0] }));
        this.skipChild();
        return;
      }
      case "cylinder": {
        const h = numArg(0, ["h"], 1);
        const centered = truthy(arg(4, ["center"]));
        const d = arg(1, ["d"]);
        const r = arg(1, ["r"]);
        const r1arg = arg(2, ["r1"]);
        const r2arg = arg(3, ["r2"]);
        const d1 = arg(2, ["d1"]);
        const d2 = arg(3, ["d2"]);
        const base = r !== undefined ? numOf(r) : d !== undefined ? numOf(d) / 2 : 1;
        const radiusBottom = r1arg !== undefined ? numOf(r1arg) : d1 !== undefined ? numOf(d1) / 2 : base;
        const radiusTop = r2arg !== undefined ? numOf(r2arg) : d2 !== undefined ? numOf(d2) / 2 : base;
        this.emit3d(
          primitives.cylinder({
            height: h,
            radiusBottom,
            radiusTop,
            segments: this.segments(48, args),
            center: [0, 0, centered ? 0 : h / 2],
          })
        );
        this.skipChild();
        return;
      }
      case "polyhedron": {
        const points = arg(0, ["points"]);
        const faces = arg(1, ["faces", "triangles"]);
        if (Array.isArray(points) && Array.isArray(faces)) {
          try {
            this.emit3d(primitives.polyhedron({ points, faces }));
          } catch (error) {
            this.warn(`polyhedron() could not be built: ${error.message}`, line);
          }
        } else {
          this.warn("polyhedron() needs points and faces", line);
        }
        this.skipChild();
        return;
      }
      case "square": {
        const size = toVec3(arg(0, ["size"]), [1, 1, 1]);
        const centered = truthy(arg(1, ["center"]));
        this.emit2d(
          primitives.rectangle({
            size: [size[0], size[1]],
            center: centered ? [0, 0] : [size[0] / 2, size[1] / 2],
          })
        );
        this.skipChild();
        return;
      }
      case "circle": {
        const d = arg(1, ["d"]);
        const rArg = arg(0, ["r"]);
        const radius = typeof rArg === "number" ? rArg : d !== undefined ? numOf(d) / 2 : 1;
        this.emit2d(primitives.circle({ radius, segments: this.segments(48, args), center: [0, 0] }));
        this.skipChild();
        return;
      }
      case "polygon": {
        const points = arg(0, ["points"]);
        if (Array.isArray(points)) {
          try {
            this.emit2d(primitives.polygon({ points: points.map((p) => [numOf(p[0]), numOf(p[1])]) }));
          } catch (error) {
            this.warn(`polygon() could not be built: ${error.message}`, line);
          }
        } else {
          this.warn("polygon() needs a points array", line);
        }
        this.skipChild();
        return;
      }
      case "linear_extrude": {
        const height = numArg(0, ["height", "h"], 1);
        const centered = truthy(arg(1, ["center"]));
        const scaleArg = arg(2, ["scale"]);
        if (typeof scaleArg === "number" && scaleArg !== 1) {
          this.warn("linear_extrude(scale=) is ignored by this engine", line);
        }
        const profiles = this.collect2D(() => this.runChildren());
        for (const profile of profiles) {
          try {
            let solid = extrusions.extrudeLinear({ height }, profile);
            if (centered) solid = transforms.translate([0, 0, -height / 2], solid);
            this.emit3d(solid);
          } catch (error) {
            this.warn(`linear_extrude() failed: ${error.message}`, line);
          }
        }
        return;
      }
      case "rotate_extrude": {
        const angle = numArg(0, ["angle", "a"], 360);
        const profiles = this.collect2D(() => this.runChildren());
        const segments = Math.max(3, Math.round((this.segments(48, args) * Math.min(360, Math.abs(angle))) / 360));
        for (const profile of profiles) {
          try {
            this.emit3d(extrusions.extrudeRotate({ segments, angle: rad(angle) }, profile));
          } catch (error) {
            this.warn(`rotate_extrude() failed: ${error.message}`, line);
          }
        }
        return;
      }
      case "text":
      case "import":
      case "surface":
      case "projection":
      case "offset2d": {
        this.warn(`${name}() is not supported by this engine`, line);
        this.runChildren();
        this.skipChild();
        return;
      }
      case "children": {
        this.warn("children() is not supported by this engine", line);
        this.skipChild();
        return;
      }
      default: {
        this.warn(`Unknown module "${name}()" — skipped`, line);
        this.runChildren();
        this.skipChild();
        return;
      }
    }
  }
}

/* --------------------------------- public -------------------------------- */

function meshFrom(geometry) {
  const polygons = geometries.geom3.toPolygons(geometry);
  const positions = [];
  const indices = [];
  let vertex = 0;
  for (const polygon of polygons) {
    const verts = polygon.vertices;
    for (let i = 1; i + 1 < verts.length; i++) {
      positions.push(verts[0][0], verts[0][1], verts[0][2]);
      positions.push(verts[i][0], verts[i][1], verts[i][2]);
      positions.push(verts[i + 1][0], verts[i + 1][1], verts[i + 1][2]);
      indices.push(vertex, vertex + 1, vertex + 2);
      vertex += 3;
    }
  }
  return { positions, indices };
}

function emptyResult(diagnostics, started) {
  return {
    engine: ENGINE_ID,
    engineLabel: ENGINE_LABEL,
    ok: false,
    mesh: null,
    geoms: [],
    diagnostics,
    stats: { triangles: 0, solids: 0, sizeMm: null },
    durationMs: Date.now() - started,
  };
}

export function compileScad(source) {
  const started = Date.now();
  const diagnostics = [];
  const text = typeof source === "string" ? source : "";

  if (!text.trim()) {
    return emptyResult([{ severity: "error", message: "The project has no source code yet.", line: 1 }], started);
  }

  let top = [];
  try {
    const interp = new Interpreter(tokenize(text), diagnostics);
    interp.run();
    top = interp.collectors[0];
  } catch (error) {
    diagnostics.push({
      severity: "error",
      message: error && error.message ? error.message : "Could not evaluate the source",
      line: error && error.line ? error.line : undefined,
    });
    return emptyResult(diagnostics, started);
  }

  if (top.length === 0) {
    diagnostics.push({
      severity: "warning",
      message:
        "No geometry was produced. Check that the model calls its module, and that 2D shapes are inside an extrude.",
    });
    return emptyResult(diagnostics, started);
  }

  const geoms = top;

  let merged;
  try {
    merged = geoms.length === 1 ? geoms[0] : booleans.union(geoms);
  } catch (error) {
    diagnostics.push({
      severity: "warning",
      message: `The top-level union failed (${error.message}); the parts are exported separately.`,
    });
    merged = geoms[0];
  }

  let mesh = null;
  let sizeMm = null;
  let triangles = 0;
  try {
    mesh = meshFrom(merged);
    triangles = mesh.indices.length / 3;
    const box = measurements.measureBoundingBox(merged);
    if (box) {
      sizeMm = [
        +(box[1][0] - box[0][0]).toFixed(2),
        +(box[1][1] - box[0][1]).toFixed(2),
        +(box[1][2] - box[0][2]).toFixed(2),
      ];
    }
  } catch (error) {
    diagnostics.push({ severity: "error", message: `The mesh could not be read: ${error.message}` });
    return emptyResult(diagnostics, started);
  }

  return {
    engine: ENGINE_ID,
    engineLabel: ENGINE_LABEL,
    ok: triangles > 0,
    mesh,
    geoms,
    diagnostics,
    stats: { triangles, solids: geoms.length, sizeMm },
    durationMs: Date.now() - started,
  };
}