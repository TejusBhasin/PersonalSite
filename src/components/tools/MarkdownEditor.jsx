import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { inputCls, cardCls, ghostBtnCls, loadLS, saveLS } from "@/lib/toolUi";
import CopyButton from "@/components/tools/CopyButton";

const TOOLBAR = [
  ["B", "**", "**", "Bold"],
  ["I", "*", "*", "Italic"],
  ["H1", "\n# ", "", "Heading 1"],
  ["H2", "\n## ", "", "Heading 2"],
  ["Quote", "\n> ", "", "Quote"],
  ["List", "\n- ", "", "Bullet list"],
  ["Code", "`", "`", "Inline code"],
  ["Block", "\n```\n", "\n```\n", "Code block"],
  ["Link", "[", "](https://)", "Link"],
];

export default function MarkdownEditor() {
  const [text, setText] = useState(() => loadLS("md-draft", "# Start writing\n\nThis editor renders **markdown** live as you type.\n\n- Drafts save automatically\n- Export to a `.md` file anytime\n"));
  const [view, setView] = useState("split");
  const ref = useRef(null);

  useEffect(() => saveLS("md-draft", text), [text]);

  const insert = (before, after) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = text.slice(start, end);
    const next = text.slice(0, start) + before + sel + after + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + before.length + sel.length + after.length;
    });
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const views = ["split", "edit", "preview"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {views.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors capitalize ${
              view === v ? "bg-foreground text-background border-foreground" : "bg-card text-foreground/70 border-border/60 hover:border-foreground/40"
            }`}
          >
            {v}
          </button>
        ))}
        <div className="flex-1" />
        <CopyButton text={text} label="Copy markdown" />
        <button onClick={download} className={ghostBtnCls}>Download .md</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TOOLBAR.map(([label, before, after, title]) => (
          <button key={label} title={title} onClick={() => insert(before, after)} className={ghostBtnCls + " !px-3 !py-1.5 min-w-9 font-mono"}>
            {label}
          </button>
        ))}
      </div>

      <div className={view === "split" ? "grid md:grid-cols-2 gap-4" : ""}>
        {view !== "preview" && (
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={inputCls + " min-h-[420px] font-mono resize-y leading-relaxed"}
            placeholder="Write markdown here..."
          />
        )}
        {view !== "edit" && (
          <div className={cardCls + " min-h-[420px] overflow-auto prose-sm"}>
            <Markdown
              components={{
                code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
                pre: ({ children }) => <pre className="bg-background border border-border/60 rounded-lg p-3 overflow-auto text-xs font-mono">{children}</pre>,
                a: ({ children, href }) => <a href={href} className="text-accent underline break-all">{children}</a>,
                ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-foreground/20 pl-3 text-muted-foreground italic my-2">{children}</blockquote>,
              }}
            >
              {text}
            </Markdown>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{words} words · {text.length} characters · draft saved on this device</p>
    </div>
  );
}