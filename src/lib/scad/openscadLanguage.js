// OpenSCAD language for Monaco — grammar and bracket rules taken from the official
// openscad-playground (https://github.com/openscad/openscad-playground, GPL2+).

const builtInFunctionNames = [
  "abs", "acos", "asin", "atan", "atan2", "ceil", "len", "let", "ln", "log",
  "lookup", "max", "min", "sqrt", "tan", "rands", "search", "sign", "sin",
  "str", "norm", "pow", "concat", "cos", "cross", "floor", "exp", "chr",
];

const builtInModuleNames = [
  "children", "circle", "color", "cube", "cylinder", "diameter", "difference",
  "echo", "extrude", "for", "function", "hull", "if", "include",
  "intersection_for", "intersection", "linear", "minkowski", "mirror", "module",
  "multmatrix", "offset", "polyhedron", "projection", "radius", "render",
  "resize", "rotate", "round", "scale", "sphere", "square", "surface",
  "translate", "union", "use", "value", "version",
];

const builtInVarNames = [
  "false", "true", "PI", "undef", "$children", "$fa", "$fn", "$fs", "$t", "$vpd", "$vpr", "$vpt",
];

export const openscadConf = {
  colorizedBracketPairs: [["{", "}"], ["(", ")"], ["[", "]"]],
  wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
  comments: { lineComment: "//", blockComment: ["/*", "*/"] },
  brackets: [["{", "}"], ["[", "]"], ["(", ")"]],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"', notIn: ["string"] },
    { open: "'", close: "'", notIn: ["string", "comment"] },
  ],
  folding: {
    markers: {
      start: /^\s*\/\/\s*#?region\b/,
      end: /^\s*\/\/\s*#?endregion\b/,
    },
  },
};

export const openscadLanguage = {
  defaultToken: "invalid",
  tokenPostfix: ".js",
  keywords: [...builtInFunctionNames, ...builtInModuleNames, ...builtInVarNames, "each"],
  typeKeywords: [],
  operators: ["<=", ">=", "==", "!=", "=>", "+", "-", "*", "/", "%", "<<", ">>", "&", "|", "^", "!", "&&", "||", "?", ":", "="],
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes: /\\[abfnrtv\\"']/,
  digits: /\d+/,
  tokenizer: {
    root: [[/[{}]/, "delimiter.bracket"], { include: "common" }],
    common: [
      [
        /[a-z_$][\w$]*/,
        { cases: { "@keywords": "keyword", "@default": "identifier" } },
      ],
      [/[A-Z][\w$]*/, "type.identifier"],
      { include: "@whitespace" },
      [/[()[\]]/, "@brackets"],
      [/[<>](?!@symbols)/, "@brackets"],
      [/!(?=([^=]|$))/, "delimiter"],
      [/@symbols/, { cases: { "@operators": "delimiter", "@default": "" } }],
      [/(@digits)[eE]([\-+]?(@digits))?/, "number.float"],
      [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, "number.float"],
      [/(@digits)n?/, "number"],
      [/[;,.]/, "delimiter"],
      [/"([^"\\]|\\.)*$/, "string.invalid"],
      [/'([^'\\]|\\.)*$/, "string.invalid"],
      [/"/, "string", "@string_double"],
    ],
    whitespace: [
      [/[ \t\r\n]+/, ""],
      [/\/\*/, "comment", "@comment"],
      [/\/\/.*$/, "comment"],
    ],
    comment: [
      [/[^/*]+/, "comment"],
      [/\*\//, "comment", "@pop"],
      [/[/*]/, "comment"],
    ],
    string_double: [
      [/[^\\"]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/"/, "string", "@pop"],
    ],
  },
};

// Charcoal CAD palette, matching the .scadman surface.
export const SCADMAN_THEME = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "e9b14c" },
    { token: "identifier", foreground: "c9d3e0" },
    { token: "type.identifier", foreground: "d7a6ff" },
    { token: "number", foreground: "8ec9ff" },
    { token: "number.float", foreground: "8ec9ff" },
    { token: "string", foreground: "9edc9e" },
    { token: "string.escape", foreground: "6fd6c4" },
    { token: "comment", foreground: "4e5a68", fontStyle: "italic" },
    { token: "delimiter", foreground: "8d97a5" },
    { token: "delimiter.bracket", foreground: "9aa7b8" },
    { token: "invalid", foreground: "ef6f6f" },
  ],
  colors: {
    "editor.background": "#0c1016",
    "editor.foreground": "#c9d3e0",
    "editorLineNumber.foreground": "#3f4a58",
    "editorLineNumber.activeForeground": "#8d97a5",
    "editorCursor.foreground": "#e9b14c",
    "editor.selectionBackground": "#23303f",
    "editor.inactiveSelectionBackground": "#1a232e",
    "editor.lineHighlightBackground": "#11161d",
    "editorIndentGuide.background1": "#1a212b",
    "editorIndentGuide.activeBackground1": "#2e3846",
    "editorBracketMatch.background": "#1f2937",
    "editorBracketMatch.border": "#3b4757",
    "editorWidget.background": "#141922",
    "editorWidget.border": "#2e3846",
    "editorSuggestWidget.background": "#141922",
    "editorSuggestWidget.border": "#2e3846",
    "scrollbarSlider.background": "#2e384680",
    "scrollbarSlider.hoverBackground": "#3b4757aa",
    "editorGutter.background": "#0c1016",
  },
};