import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";

const KEYWORDS = new Set([
  "module", "function", "for", "if", "else", "true", "false", "include", "use", "let", "each", "echo", "children",
]);
const BUILTINS = new Set([
  "cube", "sphere", "cylinder", "polyhedron", "square", "circle", "polygon", "text",
  "translate", "rotate", "scale", "mirror", "resize", "multmatrix",
  "union", "difference", "intersection", "hull", "minkowski", "offset", "projection",
  "linear_extrude", "rotate_extrude", "color", "render", "import", "surface",
]);
const TOKEN = /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*")|(\$?[A-Za-z_][A-Za-z0-9_]*)|(\d+(?:\.\d+)?)|([+\-*/%=<>!&|?:;,(){}[\]])/g;

function lineNodes(line, lineIndex) {
  const nodes = [];
  let last = 0;
  let match;
  TOKEN.lastIndex = 0;
  while ((match = TOKEN.exec(line)) !== null) {
    if (match.index > last) nodes.push(line.slice(last, match.index));
    const [text, comment, str, word, num, op] = match;
    let cls = "";
    if (comment) cls = "scad-tok-com";
    else if (str) cls = "scad-tok-str";
    else if (num) cls = "scad-tok-num";
    else if (op) cls = "scad-tok-op";
    else if (word) {
      if (KEYWORDS.has(word)) cls = "scad-tok-key";
      else if (BUILTINS.has(word)) cls = "scad-tok-mod";
      else if (line[match.index + text.length] === "(") cls = "scad-tok-fn";
      else cls = "";
    }
    nodes.push(cls ? <span key={`${lineIndex}-${match.index}`} className={cls}>{text}</span> : text);
    last = match.index + text.length;
    if (comment) break;
  }
  if (last < line.length) nodes.push(line.slice(last));
  if (nodes.length === 0) nodes.push("\u200b");
  return nodes;
}

const ScadCodeEditor = forwardRef(function ScadCodeEditor(
  { value, onChange, fontSize = 12, readOnly = false, minHeight = 320 },
  ref
) {
  const areaRef = useRef(null);
  const preRef = useRef(null);
  const gutterRef = useRef(null);
  const historyRef = useRef({ stack: [value], index: 0, stamp: 0 });

  const lines = useMemo(() => String(value ?? "").split("\n"), [value]);

  useImperativeHandle(ref, () => ({
    focus: () => areaRef.current?.focus(),
    undo: () => {
      const h = historyRef.current;
      if (h.index <= 0) return;
      h.index -= 1;
      onChange(h.stack[h.index]);
    },
    redo: () => {
      const h = historyRef.current;
      if (h.index >= h.stack.length - 1) return;
      h.index += 1;
      onChange(h.stack[h.index]);
    },
    selectAll: () => {
      const ta = areaRef.current;
      if (!ta) return;
      ta.focus();
      ta.select();
    },
  }));

  useEffect(() => {
    const h = historyRef.current;
    const now = Date.now();
    if (h.stack[h.index] === value) return;
    if (now - h.stamp < 450 && h.index > 0) {
      h.stack[h.index] = value;
    } else {
      h.stack = h.stack.slice(0, h.index + 1);
      h.stack.push(value);
      if (h.stack.length > 120) h.stack.shift();
      h.index = h.stack.length - 1;
    }
    h.stamp = now;
  }, [value]);

  const syncScroll = () => {
    const ta = areaRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
  };

  const handleKeyDown = (event) => {
    const ta = event.currentTarget;
    if (event.key === "Tab") {
      event.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const indent = "  ";
      const next = value.slice(0, start) + indent + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + indent.length;
      });
    }
    if (event.key === "Enter") {
      const start = ta.selectionStart;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const indent = (value.slice(lineStart, start).match(/^[ \t]*/) || [""])[0];
      if (indent) {
        event.preventDefault();
        const next = `${value.slice(0, start)}\n${indent}${value.slice(ta.selectionEnd)}`;
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 1 + indent.length;
        });
      }
    }
  };

  return (
    <div className="scad-editor" style={{ fontSize: `${fontSize}px`, minHeight }}>
      <div className="scad-editor-gutter" ref={gutterRef} aria-hidden="true">
        {lines.map((_, index) => (
          <div key={index}>{index + 1}</div>
        ))}
      </div>
      <div className="scad-editor-area">
        <pre className="scad-editor-pre" ref={preRef} aria-hidden="true">
          {lines.map((line, index) => (
            <div key={index}>{lineNodes(line, index)}</div>
          ))}
        </pre>
        <textarea
          ref={areaRef}
          className="scad-editor-input"
          value={value}
          readOnly={readOnly}
          spellCheck={false}
          wrap="off"
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          aria-label="OpenSCAD source code"
        />
      </div>
    </div>
  );
});

export default ScadCodeEditor;