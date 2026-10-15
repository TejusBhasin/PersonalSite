const TEXT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-bold mb-2" style={TEXT}>{title}</h2>
    <div className="text-sm leading-relaxed text-foreground/80 space-y-2">{children}</div>
  </section>
);

export default function Terms() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-black tracking-tight mb-8" style={TEXT}>Terms &amp; Conditions</h1>
      <Section title="1. Acceptance">
        <p>By accessing this website you agree to these terms. If you do not agree, please do not use the site.</p>
      </Section>
      <Section title="2. Purpose of the Site">
        <p>This is a personal portfolio website. Content is provided for informational purposes only.</p>
      </Section>
      <Section title="3. Intellectual Property">
        <p>All content on this site — including text, images, and projects — belongs to Tejus Bhasin unless stated otherwise. It may not be copied or reused without permission.</p>
      </Section>
      <Section title="4. Acceptable Use">
        <p>You agree not to misuse the site, attempt to disrupt it, or access it in ways intended to cause harm.</p>
      </Section>
      <Section title="5. Changes">
        <p>These terms may be updated at any time. Continued use of the site means you accept the updated terms.</p>
      </Section>
      <Section title="6. Contact">
        <p>Questions? Email tejusbhasin17@gmail.com.</p>
      </Section>
      <p className="text-xs text-muted-foreground">Last updated: October 2026</p>
    </main>
  );
}