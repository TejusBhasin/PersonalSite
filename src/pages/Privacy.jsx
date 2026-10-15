import { getDeviceId } from "@/lib/deviceId";

const TEXT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-bold mb-2" style={TEXT}>{title}</h2>
    <div className="text-sm leading-relaxed text-foreground/80 space-y-2">{children}</div>
  </section>
);

export default function Privacy() {
  const deviceId = getDeviceId();

  return (
    <main className="min-h-screen bg-background px-6 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-black tracking-tight mb-8" style={TEXT}>Privacy Policy</h1>

      <Section title="1. Overview">
        <p>This is a personal portfolio website operated by Tejus Bhasin. This policy explains exactly what information the site collects, why it is collected, and what you can do about it. We do not sell your data, and we do not share it with advertisers.</p>
      </Section>

      <Section title="2. Information We Collect">
        <p><strong>Visit logs.</strong> Every page visit is recorded with: the IP address the server sees, your browser's public IP address (looked up from your device), a device identifier, the page path visited, and your browser's user agent string. These logs exist to keep the site secure and to understand basic traffic.</p>
        <p><strong>Device identifier.</strong> The site assigns your browser a random device ID, stored in your browser's local storage. It is a random value — it contains no personal information and is used only to distinguish devices for security purposes.</p>
        <p><strong>Local storage.</strong> Some site features (such as the Tools section's saved flashcards and timer stats) save their data in your browser's local storage. This data never leaves your device.</p>
        <p><strong>Usage analytics.</strong> The site records anonymous page-view events through its hosting platform's built-in analytics. These events contain no personal information.</p>
      </Section>

      <Section title="3. How We Use This Information">
        <ul className="list-disc pl-5 space-y-1">
          <li>Detecting and blocking abusive, automated, or unauthorized traffic.</li>
          <li>Blocking entire networks (e.g., a shared WiFi network) whose traffic is harmful.</li>
          <li>Exempting specific trusted devices from network-level blocks.</li>
          <li>Keeping the site fast, secure, and working properly.</li>
        </ul>
        <p>Your information is not used to profile you, advertise to you, or shared with third parties for their own purposes.</p>
      </Section>

      <Section title="4. Access Restrictions">
        <p>To protect the site, visitors from blocked IP addresses or networks, or with blocked device identifiers, may be denied access. Blocked visitors see an error page. If you believe you were blocked in error, contact us (Section 8) and we can review the block.</p>
      </Section>

      <Section title="5. Cookies &amp; Third-Party Content">
        <p>The site does not use advertising cookies. Some pages embed third-party content (such as games hosted in public repositories and externally hosted images). Those providers may have their own privacy practices; this policy covers only this site.</p>
      </Section>

      <Section title="6. Your Rights">
        <p>You may request a copy of, correction of, or deletion of any visit-log data associated with you by emailing us (Section 8). Requests are handled promptly. You may also clear your browser's local storage at any time to remove your device identifier and any saved preferences.</p>
      </Section>

      <Section title="7. Data Retention">
        <p>Visit logs are retained only as long as needed for security and traffic analysis, then deleted. No sensitive personal data (payment information, government IDs, precise location) is ever collected because the site does not request it.</p>
      </Section>

      <Section title="8. Contact">
        <p>Privacy questions or data requests? Email tejusbhasin17@gmail.com.</p>
      </Section>

      <p className="text-xs text-muted-foreground">Last updated: October 2026</p>
      <p className="mt-6 text-[5px] text-muted-foreground/40 select-none" style={TEXT}>
        Version ({deviceId})
      </p>
    </main>
  );
}