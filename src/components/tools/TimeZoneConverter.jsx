import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { inputCls, labelCls, cardCls, btnCls } from "@/lib/toolUi";

const COMMON_ZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Kolkata", "Asia/Shanghai", "Australia/Sydney", "Pacific/Auckland"];

function zoneOptions() {
  try {
    if (Intl.supportedValuesOf) return Intl.supportedValuesOf("timeZone");
  } catch { /* older browser */ }
  return COMMON_ZONES;
}

function offsetMs(ts, zone) {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone: zone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = {};
  dtf.formatToParts(ts).forEach((x) => (p[x.type] = x.value));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour === 24 ? 0 : +p.hour, +p.minute, +p.second);
  return asUTC - ts.getTime();
}

function zonedToUtc(dateStr, timeStr, zone) {
  let ts = Date.parse(`${dateStr}T${timeStr}:00Z`);
  if (isNaN(ts)) return null;
  for (let i = 0; i < 2; i++) {
    const off = offsetMs(new Date(ts), zone);
    ts = Date.parse(`${dateStr}T${timeStr}:00Z`) - off;
  }
  return ts;
}

function parts(ts, zone) {
  const dtf = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
  const p = {};
  dtf.formatToParts(ts).forEach((x) => (p[x.type] = x.value));
  return p;
}

function pretty(ts, zone) {
  return new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(ts);
}

export default function TimeZoneConverter() {
  const now = new Date();
  const [src, setSrc] = useState("America/New_York");
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [time, setTime] = useState(now.toISOString().slice(11, 16));
  const [targets, setTargets] = useState(["America/Los_Angeles", "Europe/London", "Asia/Tokyo"]);
  const [newZone, setNewZone] = useState("Asia/Kolkata");
  const options = useMemo(zoneOptions, []);

  const ts = zonedToUtc(date, time, src);

  const setNow = () => {
    const p = parts(new Date(), src);
    setDate(`${p.year}-${p.month}-${p.day}`);
    setTime(`${p.hour === "24" ? "00" : p.hour}:${p.minute}`);
  };

  const addZone = () => {
    if (newZone && !targets.includes(newZone) && newZone !== src) setTargets((t) => [...t, newZone]);
  };

  const dayDelta = (zone) => {
    if (ts === null) return 0;
    const s = parts(ts, src);
    const t = parts(ts, zone);
    const ds = Date.parse(`${s.year}-${s.month}-${s.day}`);
    const dt = Date.parse(`${t.year}-${t.month}-${t.day}`);
    return Math.round((dt - ds) / 86400000);
  };

  return (
    <div className="space-y-5">
      <div className={cardCls}>
        <div className="grid md:grid-cols-4 grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Source zone</label>
            <select value={src} onChange={(e) => setSrc(e.target.value)} className={inputCls}>
              {options.map((z) => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </div>
          <div className="flex items-end">
            <button onClick={setNow} className={btnCls + " w-full"}>Use Now</button>
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{src}</p>
        <p className="text-xl font-black">
          {ts === null ? "Pick a valid date and time" : pretty(ts, src)}
        </p>
      </div>

      <div className="flex gap-2">
        <select value={newZone} onChange={(e) => setNewZone(e.target.value)} className={inputCls + " flex-1"}>
          {options.map((z) => <option key={z}>{z}</option>)}
        </select>
        <button onClick={addZone} className={btnCls + " inline-flex items-center gap-1.5"}>
          <Plus className="w-4 h-4" /> Add Zone
        </button>
      </div>

      {ts !== null && (
        <div className="space-y-2">
          {targets.map((zone) => {
            const delta = dayDelta(zone);
            return (
              <div key={zone} className="flex items-center justify-between bg-card border border-border/60 rounded-xl px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">{zone.replace(/_/g, " ")}</p>
                  <p className="text-base font-bold">{pretty(ts, zone)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {delta !== 0 && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${delta > 0 ? "bg-accent/15 text-accent" : "bg-muted text-foreground/70"}`}>
                      {delta > 0 ? `+${delta}` : delta} {Math.abs(delta) === 1 ? "day" : "days"}
                    </span>
                  )}
                  <button onClick={() => setTargets((t) => t.filter((z) => z !== zone))} className="text-foreground/30 hover:text-red-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">Day badges show the calendar difference versus the source zone, so you can spot midnight-crossing meetings instantly.</p>
    </div>
  );
}