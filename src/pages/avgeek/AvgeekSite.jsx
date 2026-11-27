import { useEffect, useState } from "react";
import AvgeekHeader from "@/components/avgeek/AvgeekHeader";
import AvgeekHero from "@/components/avgeek/AvgeekHero";
import AvgeekTools from "@/components/avgeek/AvgeekTools";
import AvgeekTerminal from "@/components/avgeek/AvgeekTerminal";
import AvgeekFooter from "@/components/avgeek/AvgeekFooter";

const THEME_KEY = "avgeek:theme";

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export default function AvgeekSite() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Storage blocked: the theme just resets next visit.
    }
  }, [theme]);

  useEffect(() => {
    const previous = document.title;
    document.title = "AvGeek Command Center";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="avgeek" data-theme={theme}>
      <AvgeekHeader theme={theme} onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} />
      <AvgeekHero />
      <AvgeekTools />
      <AvgeekTerminal />
      <AvgeekFooter />
    </div>
  );
}