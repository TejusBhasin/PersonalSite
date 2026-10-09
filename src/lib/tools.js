import { Ruler, Calculator, KeyRound, QrCode, Timer, Layers, FileText, Palette, FileCode2, Braces, Regex, Binary, Fingerprint, Keyboard, GraduationCap, Globe2, Swords } from "lucide-react";

export const TOOLS = [
  { id: "unit-converter", name: "Unit Converter", icon: Ruler, category: "Math", description: "Convert across 10 measurement families with 60+ units, from millimeters to light-years." },
  { id: "calculator", name: "Scientific Calculator", icon: Calculator, category: "Math", description: "Full expression engine with trig, logs, powers, constants, degree/radian modes and history." },
  { id: "gpa", name: "GPA Calculator", icon: GraduationCap, category: "Math", description: "Weighted and unweighted GPA across AP, IB, honors and college-prep course levels." },
  { id: "timezone", name: "Time Zone Planner", icon: Globe2, category: "Math", description: "Convert any moment across world zones and see day shifts at a glance for meetings." },
  { id: "text-analyzer", name: "Text Analyzer", icon: FileText, category: "Text & Code", description: "Readability scoring, reading time, word frequency and eight case conversions." },
  { id: "markdown-editor", name: "Markdown Editor", icon: FileCode2, category: "Text & Code", description: "Split-view markdown writing with a formatting toolbar, drafts and .md export." },
  { id: "json-formatter", name: "JSON Toolkit", icon: Braces, category: "Text & Code", description: "Validate, format, minify and inspect JSON with exact error locations and stats." },
  { id: "regex-tester", name: "Regex Tester", icon: Regex, category: "Text & Code", description: "Test patterns live with match highlighting, capture groups and a cheat sheet." },
  { id: "encoder", name: "Encoder / Decoder", icon: Binary, category: "Text & Code", description: "Base64, URL encoding, ROT13, binary, hex and Morse with full Unicode support." },
  { id: "hash", name: "Hash Generator", icon: Fingerprint, category: "Text & Code", description: "SHA-1, SHA-256, SHA-384 and SHA-512 digests computed locally in your browser." },
  { id: "flashcards", name: "Flashcards", icon: Layers, category: "Study", description: "Build decks, study with shuffle and flip, and track progress on your device." },
  { id: "focus-timer", name: "Focus Timer", icon: Timer, category: "Study", description: "Configurable Pomodoro engine with auto-cycling phases, chimes and daily stats." },
  { id: "typing", name: "Typing Test", icon: Keyboard, category: "Study", description: "Measure WPM and accuracy with live character feedback and personal bests." },
  { id: "debate-prep", name: "Debate Prep", icon: Swords, category: "Study", description: "AI-generated framework, contentions, rebuttals and cross-ex for any motion." },
  { id: "color-studio", name: "Color Studio", icon: Palette, category: "Design", description: "Convert formats, generate harmonies and check WCAG contrast accessibility." },
  { id: "qr", name: "QR Code Studio", icon: QrCode, category: "Design", description: "Design QR codes with colors, error correction, margins and Wi-Fi presets." },
  { id: "password", name: "Password Forge", icon: KeyRound, category: "Security", description: "Passwords and passphrases with entropy math, crack-time estimates and bulk output." },
];

export const TOOL_CATEGORIES = ["All", "Math", "Text & Code", "Study", "Design", "Security"];