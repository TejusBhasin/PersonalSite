import { Link } from "react-router-dom";
import { Phone, Mail, Linkedin, Download, Settings } from "lucide-react";
import useSiteTexts from "@/hooks/useSiteTexts";

export default function Footer() {
  const texts = useSiteTexts();
  return (
    <footer className="bg-foreground text-background py-10 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          {/* Brand */}
          <div>
            <p
              className="text-lg font-black tracking-widest uppercase text-background mb-1"
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              {texts?.brand_name ?? "Tejus Bhasin"}
            </p>
            <p
              className="text-xs tracking-widest uppercase text-background/60"
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              {texts?.brand_status ?? "Horace Mann School · Class of 2032"}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <a
              href="tel:9142676083"
              className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-background/70 hover:text-background transition-colors duration-200"
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              <Phone className="w-3.5 h-3.5" />
              Call/Text
            </a>
            <a
              href="https://www.linkedin.com/in/tejusbhasin/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-background/70 hover:text-background transition-colors duration-200"
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              <Linkedin className="w-3.5 h-3.5" />
              LinkedIn
            </a>
            <a
              href="mailto:tejus_bhasin@horacemann.org"
              className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-background/70 hover:text-background transition-colors duration-200"
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              <Mail className="w-3.5 h-3.5" />
              School Email
            </a>
            <a
              href="mailto:tejusbhasin17@gmail.com"
              className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-background/70 hover:text-background transition-colors duration-200"
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              <Mail className="w-3.5 h-3.5" />
              Personal Email
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-background/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            className="text-xs text-background/40 tracking-widest"
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          >
            © {new Date().getFullYear()} Tejus Bhasin. All rights reserved.
          </p>
          <a
            href="https://www.dropbox.com/scl/fi/vb09njziv6wd1blatztcc/Tejus-Bhasin.vcf?rlkey=syd87jms8g7hmpb8ii29a0q0u&st=a7qhdg09&dl=1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-background/60 hover:text-background transition-colors duration-200"
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          >
            <Download className="w-3.5 h-3.5" />
            Save My Contact
          </a>
          <Link
            to="/manage"
            className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-background/40 hover:text-background transition-colors duration-200"
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          >
            <Settings className="w-3.5 h-3.5" />
            Edit Content
          </Link>
        </div>
      </div>
    </footer>
  );
}