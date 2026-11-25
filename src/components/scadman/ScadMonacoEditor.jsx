import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  SCADMAN_THEME,
  openscadConf,
  openscadLanguage,
} from "@/lib/scad/openscadLanguage";
import ScadCodeEditor from "@/components/scadman/ScadCodeEditor";

// The OpenSCAD code area the official playground uses: Monaco, loaded from the CDN, with the
// playground's OpenSCAD grammar. If the CDN cannot be reached the plain editor takes over.
const ScadMonacoEditor = forwardRef(function ScadMonacoEditor(
  { value, onChange, fontSize = 12, readOnly = false, tabSize = 2 },
  ref
) {
  const editorRef = useRef(null);
  const mounted = useRef(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!mounted.current) setFallback(true);
    }, 9000);
    return () => window.clearTimeout(timer);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => editorRef.current?.focus(),
      undo: () => editorRef.current?.trigger("scadman", "undo", null),
      redo: () => editorRef.current?.trigger("scadman", "redo", null),
      revealLine: (line) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.revealLineInCenter(line);
        editor.setPosition({ lineNumber: line, column: 1 });
      },
    }),
    []
  );

  if (fallback) {
    return (
      <ScadCodeEditor
        value={value}
        onChange={onChange}
        fontSize={fontSize}
        readOnly={readOnly}
      />
    );
  }

  const beforeMount = (monaco) => {
    if (!monaco.languages.getLanguages().some((entry) => entry.id === "openscad")) {
      monaco.languages.register({ id: "openscad", extensions: [".scad"], aliases: ["OpenSCAD"] });
      monaco.languages.setLanguageConfiguration("openscad", openscadConf);
      monaco.languages.setMonarchTokensProvider("openscad", openscadLanguage);
    }
    monaco.editor.defineTheme("scadman", SCADMAN_THEME);
  };

  return (
    <div className="h-full w-full">
      <Editor
        language="openscad"
        theme="scadman"
        value={value}
        onChange={(next) => onChange(next ?? "")}
        beforeMount={beforeMount}
        onMount={(editor) => {
          editorRef.current = editor;
          mounted.current = true;
        }}
        loading={
          <div className="flex h-full w-full items-center justify-center gap-2 bg-[#0c1016]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2e3846] border-t-[#e9b14c]" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8d97a5]">
              loading editor
            </span>
          </div>
        }
        options={{
          readOnly,
          fontSize,
          tabSize,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          smoothScrolling: true,
          renderLineHighlight: "line",
          padding: { top: 12, bottom: 24 },
          fixedOverflowWidgets: true,
          largeFileOptimizations: true,
          wordWrap: "off",
          lineNumbersMinChars: 3,
          glyphMargin: false,
          occurrencesHighlight: false,
          selectionHighlight: false,
          scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        }}
      />
    </div>
  );
});

export default ScadMonacoEditor;