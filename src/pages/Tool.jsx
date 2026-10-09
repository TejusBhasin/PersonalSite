import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TOOLS } from "@/lib/tools";
import UnitConverter from "@/components/tools/UnitConverter";
import ScientificCalculator from "@/components/tools/ScientificCalculator";
import GpaCalculator from "@/components/tools/GpaCalculator";
import TimeZoneConverter from "@/components/tools/TimeZoneConverter";
import TextAnalyzer from "@/components/tools/TextAnalyzer";
import MarkdownEditor from "@/components/tools/MarkdownEditor";
import JsonFormatter from "@/components/tools/JsonFormatter";
import RegexTester from "@/components/tools/RegexTester";
import EncoderDecoder from "@/components/tools/EncoderDecoder";
import HashGenerator from "@/components/tools/HashGenerator";
import Flashcards from "@/components/tools/Flashcards";
import FocusTimer from "@/components/tools/FocusTimer";
import TypingTest from "@/components/tools/TypingTest";
import DebatePrep from "@/components/tools/DebatePrep";
import ColorStudio from "@/components/tools/ColorStudio";
import QrGenerator from "@/components/tools/QrGenerator";
import PasswordGenerator from "@/components/tools/PasswordGenerator";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const COMPONENTS = {
  "unit-converter": UnitConverter,
  calculator: ScientificCalculator,
  gpa: GpaCalculator,
  timezone: TimeZoneConverter,
  "text-analyzer": TextAnalyzer,
  "markdown-editor": MarkdownEditor,
  "json-formatter": JsonFormatter,
  "regex-tester": RegexTester,
  encoder: EncoderDecoder,
  hash: HashGenerator,
  flashcards: Flashcards,
  "focus-timer": FocusTimer,
  typing: TypingTest,
  "debate-prep": DebatePrep,
  "color-studio": ColorStudio,
  qr: QrGenerator,
  password: PasswordGenerator,
};

export default function Tool() {
  const { toolId } = useParams();
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool) return <Navigate to="/tools" replace />;

  const Component = COMPONENTS[tool.id];
  const Icon = tool.icon;

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8">
      <Link
        to="/tools"
        className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 mb-8"
        style={MONT}
      >
        <ArrowLeft className="w-4 h-4" />
        All Tools
      </Link>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-4 mb-8">
          <div className="bg-card border border-border/60 rounded-xl p-3 shrink-0">
            <Icon className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground" style={MONT}>
              {tool.name}
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-1 leading-relaxed">{tool.description}</p>
          </div>
        </div>
        <Component />
      </div>
    </main>
  );
}