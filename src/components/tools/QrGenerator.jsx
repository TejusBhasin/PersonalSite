import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { inputCls, labelCls, cardCls, btnCls } from "@/lib/toolUi";

const SIZES = [200, 300, 400, 600];
const ECC = ["L", "M", "Q", "H"];

export default function QrGenerator() {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("https://tejusbhasin.info");
  const [wifi, setWifi] = useState({ ssid: "", pass: "", enc: "WPA" });
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [size, setSize] = useState(300);
  const [ecc, setEcc] = useState("M");
  const [margin, setMargin] = useState(2);
  const [fg, setFg] = useState("000000");
  const [bg, setBg] = useState("ffffff");

  const data = (() => {
    if (mode === "text") return text;
    if (mode === "wifi") return wifi.ssid ? `WIFI:T:${wifi.enc};S:${wifi.ssid};P:${wifi.pass};;` : "";
    return contact.name
      ? `MECARD:N:${contact.name};TEL:${contact.phone};EMAIL:${contact.email};;`
      : "";
  })();

  const cleanHex = (v) => v.replace(/[^0-9a-fA-F]/g, "").slice(0, 6) || "000000";
  const url = data
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=${ecc}&margin=${margin}&color=${cleanHex(fg)}&bgcolor=${cleanHex(bg)}&data=${encodeURIComponent(data)}`
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {[["text", "Text / URL"], ["wifi", "Wi-Fi login"], ["contact", "Contact card"]].map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              mode === m ? "bg-foreground text-background border-foreground" : "bg-card text-foreground/70 border-border/60 hover:border-foreground/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "text" && (
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Paste a link or any text..." className={inputCls + " resize-y"} />
      )}

      {mode === "wifi" && (
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Network name (SSID)</label>
            <input value={wifi.ssid} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <input value={wifi.pass} onChange={(e) => setWifi({ ...wifi, pass: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Security</label>
            <select value={wifi.enc} onChange={(e) => setWifi({ ...wifi, enc: e.target.value })} className={inputCls}>
              <option value="WPA">WPA / WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">Open (none)</option>
            </select>
          </div>
        </div>
      )}

      {mode === "contact" && (
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Name</label>
            <input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={inputCls} />
          </div>
        </div>
      )}

      <div className={cardCls}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <div>
            <label className={labelCls}>Size</label>
            <select value={size} onChange={(e) => setSize(parseInt(e.target.value, 10))} className={inputCls}>
              {SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Error correction</label>
            <select value={ecc} onChange={(e) => setEcc(e.target.value)} className={inputCls}>
              {ECC.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Quiet zone</label>
            <input type="number" min="0" max="20" value={margin} onChange={(e) => setMargin(Math.max(0, parseInt(e.target.value, 10) || 0))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Dots (hex)</label>
            <input value={fg} onChange={(e) => setFg(e.target.value)} className={inputCls + " font-mono"} />
          </div>
          <div>
            <label className={labelCls}>Background</label>
            <input value={bg} onChange={(e) => setBg(e.target.value)} className={inputCls + " font-mono"} />
          </div>
        </div>

        {url ? (
          <div className="text-center">
            <img src={url} alt="QR code" className="mx-auto rounded-lg border border-border/60" width={Math.min(size, 400)} height={Math.min(size, 400)} />
            <a href={url} target="_blank" rel="noreferrer" className={btnCls + " mt-4 inline-flex items-center gap-1.5 text-sm"}>
              <ExternalLink className="w-4 h-4" /> Open full size
            </a>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">Fill in the fields above and the code appears here instantly.</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Higher error correction (Q, H) survives scratches and logos at the cost of density. Wi-Fi codes let phones join a network with one scan.
      </p>
    </div>
  );
}