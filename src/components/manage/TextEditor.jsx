import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function TextEditor() {
  const [texts, setTexts] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    base44.entities.SiteText.list()
      .then(setTexts)
      .catch(() => { setTexts([]); setError("Could not load text records."); });
  }, []);

  const update = (id, value) => setTexts((ts) => ts.map((t) => (t.id === id ? { ...t, value } : t)));

  const save = async (t) => {
    setBusyId(t.id);
    setError("");
    try {
      await base44.entities.SiteText.update(t.id, { value: t.value });
    } catch (e) {
      setError(e.message || "Save failed.");
    }
    setBusyId(null);
  };

  if (!texts) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const sections = {};
  texts.forEach((t) => {
    const s = t.section || "General";
    if (!sections[s]) sections[s] = [];
    sections[s].push(t);
  });

  return (
    <div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {Object.keys(sections).map((section) => (
        <div key={section} className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4" style={MONT}>
            {section}
          </h2>
          <div className="space-y-4">
            {sections[section].map((t) => (
              <div key={t.id} className="border border-border rounded-lg p-4 bg-card">
                <label className="block text-sm font-semibold mb-2">{t.label || t.key}</label>
                <Textarea
                  value={t.value || ""}
                  onChange={(e) => update(t.id, e.target.value)}
                  rows={(t.value || "").length > 120 ? 5 : 2}
                />
                <Button size="sm" className="mt-3" onClick={() => save(t)} disabled={busyId === t.id}>
                  <Save className="w-3.5 h-3.5 mr-2" />
                  Save
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}