import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, Trash2 } from "lucide-react";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function RecordManager({ entityName, fields, defaults = {}, addLabel = "Add New" }) {
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    base44.entities[entityName].list("sort_order", 200)
      .then(setRecords)
      .catch(() => { setRecords([]); setError("Could not load records."); });
  }, [entityName]);

  const update = (id, key, value) =>
    setRecords((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const displayValue = (rec, field) => {
    const v = rec[field.key];
    if (field.type === "list") return Array.isArray(v) ? v.join(", ") : v ?? "";
    return v ?? "";
  };

  const addNew = () => {
    const draft = { ...defaults };
    fields.forEach((f) => { if (draft[f.key] === undefined) draft[f.key] = f.type === "boolean" ? true : ""; });
    draft.id = `draft-${Date.now()}`;
    setRecords((rs) => [...rs, draft]);
  };

  const remove = async (rec) => {
    setError("");
    if (!rec.id || rec.id.startsWith("draft-")) {
      setRecords((rs) => rs.filter((r) => r.id !== rec.id));
      return;
    }
    if (!window.confirm(`Delete "${rec.title || rec.name}"?`)) return;
    setBusyId(rec.id);
    try {
      await base44.entities[entityName].delete(rec.id);
      setRecords((rs) => rs.filter((r) => r.id !== rec.id));
    } catch (e) {
      setError(e.message || "Delete failed.");
    }
    setBusyId(null);
  };

  const save = async (rec) => {
    setError("");
    setBusyId(rec.id);
    try {
      const payload = {};
      fields.forEach((f) => {
        let v = rec[f.key];
        if (f.type === "list") v = (v || "").split(",").map((s) => s.trim()).filter(Boolean);
        if (f.type === "number") v = v === "" || v == null ? 0 : parseInt(v, 10) || 0;
        if (f.type === "boolean") v = v !== false;
        payload[f.key] = v;
      });
      if (entityName === "Project") {
        if (!payload.slug) payload.slug = slugify(payload.name || "");
        if (!payload.preview && payload.url) {
          payload.preview = `https://s0.wp.com/mshots/v1/${encodeURIComponent(payload.url)}?w=1024&h=640`;
        }
      }
      if (rec.id && !rec.id.startsWith("draft-")) {
        await base44.entities[entityName].update(rec.id, payload);
      } else {
        await base44.entities[entityName].create(payload);
      }
      const rows = await base44.entities[entityName].list("sort_order", 200);
      setRecords(rows);
    } catch (e) {
      setError(e.message || "Save failed.");
    }
    setBusyId(null);
  };

  if (!records) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      <Button onClick={addNew} className="mb-6" style={MONT}>
        <Plus className="w-4 h-4 mr-2" />
        {addLabel}
      </Button>

      <div className="space-y-6">
        {records.map((rec) => (
          <div key={rec.id} className="border border-border rounded-lg p-6 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" || f.type === "list" ? "md:col-span-2" : ""}>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5" style={MONT}>
                    {f.label}
                  </label>
                  {f.type === "textarea" ? (
                    <Textarea
                      value={displayValue(rec, f)}
                      onChange={(e) => update(rec.id, f.key, e.target.value)}
                      rows={4}
                    />
                  ) : f.type === "boolean" ? (
                    <label className="flex items-center gap-2 text-sm py-2">
                      <input
                        type="checkbox"
                        checked={rec[f.key] !== false}
                        onChange={(e) => update(rec.id, f.key, e.target.checked)}
                        className="w-4 h-4"
                      />
                      Show on site
                    </label>
                  ) : f.type === "select" ? (
                    <select
                      value={displayValue(rec, f)}
                      onChange={(e) => update(rec.id, f.key, e.target.value)}
                      className="w-full h-10 border border-input rounded-md px-3 bg-background text-sm"
                    >
                      {f.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={f.type === "number" ? "number" : "text"}
                      value={displayValue(rec, f)}
                      onChange={(e) => update(rec.id, f.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={() => save(rec)} disabled={busyId === rec.id}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => remove(rec)} disabled={busyId === rec.id}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}