import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import useScadProfile from "@/hooks/useScadProfile";
import ScadIntegrationStatus from "@/components/scadman/ScadIntegrationStatus";
import { VISIBILITY_HINT, VISIBILITY_LABEL, formatDate } from "@/lib/scad/format";

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="scad-label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10px] leading-relaxed text-[color:var(--scad-dim)]">{hint}</p>}
    </div>
  );
}

export default function ScadSettings() {
  const { user } = useAuth();
  const { profile, setProfile, loading } = useScadProfile();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (profile && !form) setForm({ ...profile });
  }, [profile, form]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setNotice("");
    try {
      const payload = {
        username: form.username,
        display_name: form.display_name,
        bio: form.bio,
        printer: form.printer,
        nozzle_diameter: Number(form.nozzle_diameter) || 0.4,
        filament_type: form.filament_type,
        slicer: form.slicer,
        infill_percent: Number(form.infill_percent) || 15,
        layer_height: Number(form.layer_height) || 0.2,
        supports: Boolean(form.supports),
        bed_temp: Number(form.bed_temp) || 60,
        nozzle_temp: Number(form.nozzle_temp) || 210,
        default_visibility: form.default_visibility,
        autosave: Boolean(form.autosave),
        editor_font_size: Number(form.editor_font_size) || 12,
        editor_tab_width: Number(form.editor_tab_width) || 2,
      };
      const updated = await base44.entities.ScadProfile.update(profile.id, payload);
      setProfile(updated);
      setForm({ ...updated });
      setNotice("Settings saved.");
    } catch (e) {
      setNotice(e.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2e3846] border-t-[#e9b14c]" />
      </div>
    );
  }

  return (
    <div className="scad-wrap max-w-[900px]">
      <p className="scad-eyebrow">Account</p>
      <h1 className="scad-h1 mt-2 text-[26px]">Settings</h1>
      <p className="scad-body mt-2">
        These defaults feed every project. A project can override the print values without touching
        your account.
      </p>

      {notice && (
        <p className="mt-4 text-[11.5px] font-semibold" style={{ color: "var(--scad-accent)" }}>
          {notice}
        </p>
      )}

      <section className="scad-panel mt-6 p-4">
        <h2 className="scad-h3">Account</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Google account">
            <input className="scad-input" value={user?.email || ""} readOnly />
          </Field>
          <Field label="Member since">
            <input className="scad-input" value={formatDate(user?.created_date)} readOnly />
          </Field>
          <Field label="Display name">
            <input
              className="scad-input"
              value={form.display_name || ""}
              onChange={(e) => update("display_name", e.target.value)}
            />
          </Field>
          <Field label="Username">
            <input
              className="scad-input"
              value={form.username || ""}
              onChange={(e) => update("username", e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Bio" hint="Shown on your published models.">
              <textarea
                rows={3}
                className="scad-textarea"
                value={form.bio || ""}
                onChange={(e) => update("bio", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="scad-panel mt-3 p-4">
        <h2 className="scad-h3">Print defaults</h2>
        <p className="scad-body mt-1 text-[11px]">
          Used for recommendations and for the G-code settings that will be sent to the slicer.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Printer">
            <input
              className="scad-input"
              placeholder="Prusa MK4"
              value={form.printer || ""}
              onChange={(e) => update("printer", e.target.value)}
            />
          </Field>
          <Field label="Slicer">
            <select
              className="scad-select"
              value={form.slicer || "PrusaSlicer"}
              onChange={(e) => update("slicer", e.target.value)}
            >
              {["PrusaSlicer", "OrcaSlicer", "Bambu Studio", "Cura", "Other"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nozzle diameter (mm)">
            <select
              className="scad-select"
              value={String(form.nozzle_diameter || 0.4)}
              onChange={(e) => update("nozzle_diameter", e.target.value)}
            >
              {["0.25", "0.3", "0.4", "0.5", "0.6", "0.8"].map((option) => (
                <option key={option} value={option}>
                  {option} mm
                </option>
              ))}
            </select>
          </Field>
          <Field label="Filament">
            <select
              className="scad-select"
              value={form.filament_type || "PLA"}
              onChange={(e) => update("filament_type", e.target.value)}
            >
              {["PLA", "PETG", "ABS", "ASA", "TPU", "Nylon", "PLA-CF"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Layer height (mm)">
            <input
              type="number"
              step="0.05"
              className="scad-input"
              value={form.layer_height ?? 0.2}
              onChange={(e) => update("layer_height", e.target.value)}
            />
          </Field>
          <Field label="Infill (%)">
            <input
              type="number"
              step="5"
              className="scad-input"
              value={form.infill_percent ?? 15}
              onChange={(e) => update("infill_percent", e.target.value)}
            />
          </Field>
          <Field label="Nozzle temperature (°C)">
            <input
              type="number"
              className="scad-input"
              value={form.nozzle_temp ?? 210}
              onChange={(e) => update("nozzle_temp", e.target.value)}
            />
          </Field>
          <Field label="Bed temperature (°C)">
            <input
              type="number"
              className="scad-input"
              value={form.bed_temp ?? 60}
              onChange={(e) => update("bed_temp", e.target.value)}
            />
          </Field>
          <Field label="Supports">
            <button
              type="button"
              onClick={() => update("supports", !form.supports)}
              className="scad-btn w-full justify-between"
            >
              <span className="text-[11px] uppercase tracking-[0.1em]">{form.supports ? "on" : "off"}</span>
              <span
                className="h-3.5 w-7 rounded-full"
                style={{ background: form.supports ? "var(--scad-accent)" : "var(--scad-panel-3)" }}
              />
            </button>
          </Field>
        </div>
      </section>

      <section className="scad-panel mt-3 p-4">
        <h2 className="scad-h3">Editor & privacy</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Editor font size">
            <input
              type="number"
              min="10"
              max="20"
              className="scad-input"
              value={form.editor_font_size ?? 12}
              onChange={(e) => update("editor_font_size", e.target.value)}
            />
          </Field>
          <Field label="Tab width">
            <input
              type="number"
              min="2"
              max="8"
              className="scad-input"
              value={form.editor_tab_width ?? 2}
              onChange={(e) => update("editor_tab_width", e.target.value)}
            />
          </Field>
          <Field label="Autosave">
            <button
              type="button"
              onClick={() => update("autosave", !form.autosave)}
              className="scad-btn w-full justify-between"
            >
              <span className="text-[11px] uppercase tracking-[0.1em]">{form.autosave ? "on" : "off"}</span>
              <span
                className="h-3.5 w-7 rounded-full"
                style={{ background: form.autosave ? "var(--scad-accent)" : "var(--scad-panel-3)" }}
              />
            </button>
          </Field>
          <Field label="Default project visibility" hint={VISIBILITY_HINT[form.default_visibility]}>
            <select
              className="scad-select"
              value={form.default_visibility || "private"}
              onChange={(e) => update("default_visibility", e.target.value)}
            >
              {Object.entries(VISIBILITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={save} disabled={saving} className="scad-btn scad-btn-primary">
          {saving ? "Saving…" : "Save settings"}
        </button>
        <button type="button" onClick={() => base44.auth.logout("/scadman")} className="scad-btn">
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>

      <section className="mt-8">
        <h2 className="scad-h2">Integrations</h2>
        <p className="scad-body mt-1 text-[11.5px]">
          What is genuinely connected, and what still needs an external service.
        </p>
        <div className="scad-panel mt-3 overflow-hidden">
          <ScadIntegrationStatus />
        </div>
      </section>
    </div>
  );
}