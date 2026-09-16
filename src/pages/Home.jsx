import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Phone, Linkedin, Mail, Download, Award, BookOpen, Camera, Trophy, Users } from "lucide-react";
import LargeProjectsSection from "@/components/projects/LargeProjectsSection";
import DebateAwardsCard from "@/components/awards/DebateAwardsCard";

// --- Utility Components ---

const AnimatedElement = ({ children, className = "", delay = 0, direction = "up" }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Reveal immediately if already in viewport on mount
    if (rect.top < window.innerHeight) { 
      setIsVisible(true); 
      return; 
    }
    
    const fallback = setTimeout(() => setIsVisible(true), 800 + delay);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { 
        clearTimeout(fallback); 
        setTimeout(() => setIsVisible(true), delay); 
        observer.unobserve(el); 
      }
    }, { threshold: 0.05, rootMargin: '0px 0px 100px 0px' });
    
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, [delay]);

  const translateClass = direction === "up" ? "translate-y-8" 
    : direction === "left" ? "translate-x-8" 
    : direction === "right" ? "-translate-x-8" 
    : "translate-y-0 scale-95";

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : `opacity-0 ${translateClass}`} ${className}`}
    >
      {children}
    </div>
  );
};

// --- Page Sections ---

function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center bg-secondary -mt-[76px] pt-[76px]">
      
      {/* Abstract Wave Background (matching screenshot aesthetic) */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <svg className="absolute top-0 w-full h-[60%]" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path fill="currentColor" className="text-muted" fillOpacity="0.8" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
        <svg className="absolute bottom-0 w-full h-[60%]" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path fill="currentColor" className="text-muted" fillOpacity="0.5" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Floating Ambient Orbs for visual depth */}
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-background/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[25rem] h-[25rem] bg-foreground/5 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-7xl px-6"
      >
        {/* Main Hero Card exactly matching screenshot structure */}
        <div className="border-[4px] border-foreground/80 rounded-2xl bg-background/30 backdrop-blur-md px-8 py-16 sm:px-16 sm:py-20 text-center shadow-2xl overflow-hidden relative group">
          
          {/* Subtle shine effect on card */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-background/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground mb-6"
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          >
            TEJUS BHASIN
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-base sm:text-xl md:text-2xl font-medium tracking-wide text-foreground/80 uppercase max-w-2xl mx-auto leading-relaxed"
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          >
            Student at Horace Mann, Class of 2032
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="bg-background py-24 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <AnimatedElement>
          <h2
            className="text-3xl md:text-4xl font-bold text-foreground mb-16 tracking-tight text-center"
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          >
            About Me
          </h2>
        </AnimatedElement>

        <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center md:items-start">
          {/* Text Content */}
          <AnimatedElement direction="right" delay={200} className="flex-1 order-2 md:order-1">
            <div className="prose prose-lg dark:prose-invert">
              <p className="text-foreground/80 leading-loose text-base text-justify font-medium">
                I'm a natural-born leader with a drive for success and creating change in the community around me. I love being creative and applying logic to everyday tasks. I like to tinker around with code, build online platforms, and dive into tech-related areas. I have experience in coding, digital modeling, website and app fabrication, AI leverage, and am active in math and science. 
              </p>
              <p className="text-foreground/80 leading-loose text-base text-justify font-medium mt-4">
                I have a passion for parliamentary debate and represent my school in our debate team. I do fencing and play the drums, as well as participate in a variety of after-school clubs and activities. I also love reading and making creative things to simplify everyday life. I have founded a Pokémon club, been elected for the student council 2 times, have led a petition that was heard and implemented by the city council, won numerous debate awards, and much more. Alongside that, I also love photography and image editing.
              </p>
            </div>
          </AnimatedElement>

          {/* Photo exactly matching screenshot placement */}
          <AnimatedElement direction="left" delay={300} className="w-full max-w-[320px] order-1 md:order-2 shrink-0">
            <div className="relative group rounded-xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-foreground/20 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
              <img
                src="https://media.base44.com/images/public/6a29e04307b892bb19072d29/62e0f2ed8_lh3_googleusercontent_com_AA5AbUD3pTVmj78h3cm0KSASrke7KecmJ-whXSuvYzJ1dWHKSsK5nnh80eh9zqO88vPPE42erEb30jd6WVek9QEO28jS5aDjkIp89PEr5RIJNcVBXGz8bzyqGyeJCAkFArE5dwAcHWivgXMrOruwXIq0n8YSOxJVaR1sSgDtsfddvfatGG4uSVexeGZnlMB3f5y4csb80eWpQwN9RVUV-_caA5uQUmOQzCwQ5ARnoz9q_w1280_951ea3bd.png"
                alt="Tejus Bhasin"
                className="w-full h-auto object-cover aspect-[4/5] scale-105 group-hover:scale-110 transition-transform duration-700 ease-in-out"
              />
            </div>
          </AnimatedElement>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="bg-background pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Contact Grid matching screenshot dark buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[
            { icon: Phone, label: "Call/Text Me", href: "tel:9142676083" },
            { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/tejusbhasin/" },
            { icon: Mail, label: "School Email", href: "mailto:tejus_bhasin@horacemann.org" },
            { icon: Mail, label: "Personal Email", href: "mailto:tejusbhasin17@gmail.com" }
          ].map((item, idx) => (
            <AnimatedElement key={idx} delay={idx * 100}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-foreground text-background px-6 py-4 rounded-md font-semibold text-sm tracking-wide hover:bg-foreground/80 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl group"
                style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
              >
                {item.label}
              </a>
            </AnimatedElement>
          ))}
        </div>

        {/* Save Contact full-width */}
        <AnimatedElement delay={400}>
          <a
            href="https://www.dropbox.com/scl/fi/vb09njziv6wd1blatztcc/Tejus-Bhasin.vcf?rlkey=syd87jms8g7hmpb8ii29a0q0u&st=a7qhdg09&dl=1"
            target="_blank"
            rel="noopener noreferrer"
            className="relative overflow-hidden flex items-center justify-center gap-2 w-full bg-foreground text-background px-6 py-4 rounded-md font-semibold text-sm tracking-wide hover:bg-foreground/80 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl group"
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-background/10 to-transparent translate-x-[-200%] group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
            Save My Contact
          </a>
        </AnimatedElement>
      </div>
    </section>
  );
}

function AchievementsSection() {
  const achievements = [
    { title: "Founded Pokémon Club", desc: "Brought together fellow enthusiasts and built a thriving school community.", icon: Users },
    { title: "Student Council (x2)", desc: "Elected twice to represent and serve the student body.", icon: Award },
    { title: "City Council Petition", desc: "Led a successful petition heard and implemented by the city council.", icon: BookOpen },
    { title: "Debate Awards", desc: "Won numerous awards in parliamentary debate competitions.", icon: Trophy },
    { title: "Varsity Fencing", desc: "Competing in fencing and continually sharpening athletic discipline.", icon: Award },
    { title: "Photography & Editing", desc: "Passionate about capturing moments and crafting stunning visuals.", icon: Camera },
  ];

  return (
    <section className="bg-secondary/50 py-24 px-6 border-t border-border/50">
      <div className="max-w-7xl mx-auto">
        <AnimatedElement>
          <div className="flex items-center gap-4 mb-12">
            <h2
              className="text-2xl md:text-3xl font-bold text-foreground tracking-tight"
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            >
              Highlights & Achievements
            </h2>
            <div className="flex-1 h-px bg-border/60" />
          </div>
        </AnimatedElement>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((item, index) => (
            item.title === "Debate Awards" ? (
              <AnimatedElement key="debate-awards" delay={index * 100}>
                <DebateAwardsCard />
              </AnimatedElement>
            ) : (
            <AnimatedElement key={index} delay={index * 100}>
              <div className="bg-card/80 backdrop-blur-sm border border-border/60 p-8 rounded-xl hover:-translate-y-2 hover:shadow-xl hover:border-foreground/30 transition-all duration-400 group h-full flex flex-col relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-foreground/5 rounded-full blur-2xl group-hover:bg-foreground/10 transition-colors duration-500" />
                <item.icon className="w-8 h-8 text-foreground/60 mb-5 group-hover:text-foreground group-hover:scale-110 transition-all duration-300" />
                <h3
                  className="text-base font-bold text-foreground tracking-wide mb-3 group-hover:text-foreground transition-colors duration-200"
                  style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{item.desc}</p>
              </div>
            </AnimatedElement>
            )
          ))}
        </div>
      </div>
    </section>
  );
}

function SkillsSection() {
  const skills = [
    "Coding & Development", "Digital Modeling", "Website & App Fabrication", 
    "AI Leverage", "Parliamentary Debate", "Fencing", "Drums", 
    "Photography & Image Editing", "Mathematics", "Science", 
    "Leadership", "Community Organizing"
  ];

  return (
    <section className="bg-background py-24 px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle,_hsl(var(--border))_1px,_transparent_1px)] bg-[length:32px_32px] opacity-30 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10 text-center">
        <AnimatedElement>
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground mb-12 tracking-tight"
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          >
            Skills & Interests
          </h2>
        </AnimatedElement>

        <div className="flex flex-wrap gap-3 justify-center">
          {skills.map((skill, index) => (
            <AnimatedElement key={index} delay={index * 50} className="inline-block">
              <span
                className="inline-flex items-center justify-center border border-border bg-card/50 backdrop-blur-sm px-5 py-3 rounded-full text-xs font-bold text-card-foreground/80 tracking-widest uppercase hover:bg-foreground hover:text-background hover:border-foreground hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default"
                style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
              >
                {skill}
              </span>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-clip bg-background text-foreground font-sans selection:bg-foreground selection:text-background">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
      <HeroSection />
      <AboutSection />
      <ContactSection />
      <AchievementsSection />
      <LargeProjectsSection />
      <SkillsSection />
    </main>
  );
}