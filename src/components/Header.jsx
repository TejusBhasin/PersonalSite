import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link
          to="/"
          className="font-black text-lg tracking-widest text-foreground hover:text-foreground/70 transition-colors duration-300 uppercase"
          style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
        >
          Tejus Bhasin
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-8">
          <Link
            to="/"
            className="text-xs font-bold tracking-[0.2em] uppercase text-foreground/70 hover:text-foreground transition-colors duration-300 relative group"
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          >
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-foreground transition-all duration-300 group-hover:w-full" />
          </Link>
          <a
            href="mailto:tejusbhasin17@gmail.com"
            className="text-xs font-bold tracking-[0.2em] uppercase text-foreground/70 hover:text-foreground transition-colors duration-300 relative group"
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          >
            Contact
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-foreground transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href="https://www.linkedin.com/in/tejusbhasin/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold tracking-[0.2em] uppercase text-foreground/70 hover:text-foreground transition-colors duration-300 relative group"
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          >
            LinkedIn
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-foreground transition-all duration-300 group-hover:w-full" />
          </a>
        </nav>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild className="sm:hidden">
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background w-full sm:w-80 border-l border-border">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <nav className="flex flex-col gap-8 mt-16 px-4">
              <Link
                to="/"
                className="text-2xl font-black tracking-widest uppercase text-foreground hover:text-foreground/70 transition-colors duration-200"
                style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
              >
                Home
              </Link>
              <a
                href="mailto:tejusbhasin17@gmail.com"
                className="text-2xl font-black tracking-widest uppercase text-foreground/70 hover:text-foreground transition-colors duration-200"
                style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
              >
                Contact
              </a>
              <a
                href="https://www.linkedin.com/in/tejusbhasin/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl font-black tracking-widest uppercase text-foreground/70 hover:text-foreground transition-colors duration-200"
                style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
              >
                LinkedIn
              </a>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}