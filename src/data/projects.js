export const projects = [
  {
    slug: "lexio-reading",
    name: "Lexio Reading",
    url: "https://lexioreading.app",
    tagline: "Your reading life, supercharged.",
    preview: "https://s0.wp.com/mshots/v1/https%3A%2F%2Flexioreading.app?w=1280&h=800",
    skills: ["AI Leverage", "App Development", "Book Data APIs", "Product Design", "Web Fabrication"],
    summary:
      "Lexio Reading is an AI-powered reading platform. Discover trending titles, search millions of books, track your personal library, and chat with an AI reading companion that learns your taste over time.",
    why:
      "I love reading, but I kept losing track of what I wanted to read next and never had anyone to talk to about a book the moment I finished it. I built Lexio to fix both — a library that remembers everything and an AI companion that's always ready to discuss what you're reading.",
    description:
      "The app is organized around three core experiences. Discover surfaces trending titles and lets you search a catalog of millions of books. AI Recommendations turns your library and ratings into personalized picks. Chat gives you a reading companion that knows your taste, so you can talk about themes, characters, or what to read next anytime."
  },
  {
    slug: "debatelab",
    name: "DebateLab",
    url: "https://debatelab.pro",
    tagline: "Your debate prep, supercharged.",
    preview: "https://s0.wp.com/mshots/v1/https%3A%2F%2Fdebatelab.pro?w=1280&h=800",
    skills: ["AI Leverage", "Parliamentary Debate", "App Development", "Coaching Systems", "Web Fabrication"],
    summary:
      "DebateLab is an AI-powered debate prep platform: generate tournament-ready contentions for any resolution in seconds, debate practice rounds against an AI opponent with a full judge decision, get AI coaching insights and a custom prep plan, and draft MUN documents — all in one place.",
    why:
      "I compete in parliamentary debate and represent my school, and the hardest part of prep is always the same: needing a partner, a judge, and hours of research before you can even start. I built DebateLab so any debater can drill a full round and get judged feedback instantly, whenever they want.",
    description:
      "AI Contentions turns any resolution into structured, tournament-ready arguments in seconds. Practice Rounds pits you against an AI opponent and hands down a complete judge decision with feedback. AI Coaching analyzes your performance and builds a custom prep plan, and the MUN document tools generate position papers and working papers for Model UN."
  },
  {
    slug: "lexio-edu",
    name: "Lexio Edu",
    url: "https://lexioedu.org",
    tagline: "Lexio for your entire school.",
    preview: "https://s0.wp.com/mshots/v1/https%3A%2F%2Flexioedu.org?w=1280&h=800",
    skills: ["AI Leverage", "EdTech", "App Development", "Data Dashboards", "Web Fabrication"],
    summary:
      "Lexio Edu is the school edition of Lexio. Students join with their school's 6-digit code — or get matched to their school automatically by email — and land in their school's own private reading platform, separate from public Lexio.",
    why:
      "After building the public Lexio app, I wanted to bring the same AI reading tools to entire schools. Lexio Edu gives every school its own private space, with a secure authorization flow so only real schools can be created and only their students get in.",
    description:
      "Admins create a school using a 300-character authorization code, students join instantly with their school's 6-digit code, and anyone without a code is matched to their school by email automatically. Each school gets its own isolated Lexio platform, with public LexioReading.App always one click away."
  },
  {
    slug: "actio",
    name: "Actio Productivity",
    url: "https://actioproductivity.com",
    tagline: "Your life, supercharged.",
    preview: "https://s0.wp.com/mshots/v1/https%3A%2F%2Factioproductivity.com?w=1280&h=800",
    skills: ["AI Leverage", "Gmail & Calendar Sync", "Task Systems", "App Development", "Automation"],
    summary:
      "Actio is an AI-powered productivity platform: a brain dump that turns messy notes, emails, and voice memos into filed tasks, a smart planner that builds realistic daily and weekly plans, and an AI assistant that answers 'what should I focus on today?' — with Gmail and Calendar sync built in.",
    why:
      "I was juggling school, debate, fencing, clubs, and side projects, and my task lists were scattered everywhere. I built Actio so one inbox-first system could capture everything, triage it with AI, and actually tell me what matters each day.",
    description:
      "The AI Brain Dump reads a messy thought, email, or voice note and files each task automatically. Smart Planner generates a realistic plan with priorities, due dates, and project breakdowns. The AI Assistant draws on your tasks, calendar, notes, and inbox — it can even draft and send emails. Everything lands in one inbox first, memories give the AI long-term context, and projects group related work with their own views and progress."
  },
  {
    slug: "susorbus",
    name: "SusorBus",
    url: "https://susorbus.com",
    tagline: "Is it bussin or sus?",
    preview: "https://s0.wp.com/mshots/v1/https%3A%2F%2Fsusorbus.com?w=1280&h=800",
    skills: ["AI Leverage", "Web Safety Analysis", "Full-Stack Development", "NLP", "Web Fabrication"],
    summary:
      "SusorBus is a web safety analyzer with a sense of humor. Paste a link, HTML, code, an email, or any text, and it gives you an instant safety verdict — is it bussin or sus? — flagging phishing, scams, and sketchy content.",
    why:
      "I wanted to build something that combined real safety analysis with an internet-native personality. Phishing and scam links are a real problem — especially for students — and a tool people actually enjoy using gets used more often.",
    description:
      "SusorBus accepts URLs, raw HTML, code, emails, plain text, and documents, then runs them through an AI safety analysis that checks for scams, phishing patterns, and malicious content. The verdict comes back instantly in the app's signature bussin-or-sus style — fun on the surface, rigorous underneath."
  }
];

export const getProjectBySlug = (slug) => projects.find((p) => p.slug === slug);