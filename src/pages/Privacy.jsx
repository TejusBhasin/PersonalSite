const TEXT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-bold mb-2" style={TEXT}>{title}</h2>
    <div className="text-sm leading-relaxed text-foreground/80 space-y-2">{children}</div>
  </section>
);

export default function Privacy() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-black tracking-tight mb-8" style={TEXT}>Privacy Policy</h1>
      <Section title="1. Overview">
        <p>This personal portfolio site collects minimal information, described below. We do not sell or share your data with third parties.</p>
      </Section>
      <Section title="2. Information Collected">
        <p>When you visit, the site may record your IP address, device identifier, browser type, and the pages you view. This is used to keep the site secure and working properly.</p>
      </Section>
      <Section title="3. Cookies &amp; Local Storage">
        <p>The site may store a small identifier on your device to remember your preferences and distinguish devices.</p>
      </Section>
      <Section title="4. Third-Party Content">
        <p>Some pages embed third-party content (e.g., photos or games). Those providers may have their own privacy practices.</p>
      </Section>
      <Section title="5. Your Choices">
        <p>You can clear cookies and local storage in your browser at any time to remove the device identifier.</p>
      </Section>
      <Section title="6. Contact">
        <p>Privacy questions? Email tejusbhasin17@gmail.com.</p>
      </Section>
      <p className="text-xs text-muted-foreground">Last updated: October 2026</p>
    </main>
  );
}