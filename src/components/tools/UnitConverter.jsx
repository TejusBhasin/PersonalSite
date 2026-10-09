import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { inputCls, labelCls, cardCls, ghostBtnCls, fmtNum } from "@/lib/toolUi";
import CopyButton from "@/components/tools/CopyButton";

const CATS = {
  Length: { Millimeter: 0.001, Centimeter: 0.01, Meter: 1, Kilometer: 1000, Inch: 0.0254, Foot: 0.3048, Yard: 0.9144, Mile: 1609.344, "Nautical mile": 1852, "Light-year": 9.4607e15 },
  Mass: { Milligram: 1e-6, Gram: 0.001, Kilogram: 1, "Metric ton": 1000, Ounce: 0.0283495, Pound: 0.453592, Stone: 6.35029 },
  Temperature: { Celsius: "C", Fahrenheit: "F", Kelvin: "K" },
  Volume: { Milliliter: 0.001, Liter: 1, "Cubic meter": 1000, Teaspoon: 0.00492892, Tablespoon: 0.0147868, "Cup (US)": 0.236588, "Pint (US)": 0.473176, "Quart (US)": 0.946353, "Gallon (US)": 3.78541 },
  Area: { "Square meter": 1, "Square kilometer": 1e6, "Square foot": 0.092903, "Square mile": 2.59e6, Acre: 4046.86, Hectare: 10000 },
  Speed: { "Meters/second": 1, "Kilometers/hour": 0.277778, "Miles/hour": 0.44704, Knot: 0.514444, "Feet/second": 0.3048 },
  Data: { Bit: 0.125, Byte: 1, Kilobyte: 1e3, Megabyte: 1e6, Gigabyte: 1e9, Terabyte: 1e12, Kibibyte: 1024, Mebibyte: 1048576, Gibibyte: 1.074e9 },
  Time: { Millisecond: 0.001, Second: 1, Minute: 60, Hour: 3600, Day: 86400, Week: 604800, Month: 2629800, Year: 31557600 },
  Energy: { Joule: 1, Kilojoule: 1000, Calorie: 4.184, Kilocalorie: 4184, "Watt-hour": 3600, "Kilowatt-hour": 3.6e6, BTU: 1055.06 },
  Pressure: { Pascal: 1, Kilopascal: 1000, Bar: 1e5, PSI: 6894.76, Atmosphere: 101325, mmHg: 133.322 },
};

const toC = (v, u) => (u === "Celsius" ? v : u === "Fahrenheit" ? ((v - 32) * 5) / 9 : v - 273.15);
const fromC = (c, u) => (u === "Celsius" ? c : u === "Fahrenheit" ? (c * 9) / 5 + 32 : c + 273.15);

export default function UnitConverter() {
  const [cat, setCat] = useState("Length");
  const units = Object.keys(CATS[cat]);
  const [from, setFrom] = useState("Foot");
  const [to, setTo] = useState("Meter");
  const [value, setValue] = useState("1");

  const pickCat = (c) => {
    setCat(c);
    const u = Object.keys(CATS[c]);
    setFrom(u[0]);
    setTo(u[1] || u[0]);
  };

  const result = useMemo(() => {
    const v = parseFloat(value);
    if (isNaN(v)) return null;
    if (cat === "Temperature") return fromC(toC(v, from), to);
    const table = CATS[cat];
    return (v / table[from]) * table[to];
  }, [value, from, to, cat]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {Object.keys(CATS).map((c) => (
          <button
            key={c}
            onClick={() => pickCat(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-colors ${
              cat === c ? "bg-foreground text-background border-foreground" : "bg-card text-foreground/70 border-border/60 hover:border-foreground/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className={cardCls}>
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div>
            <label className={labelCls}>From</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className={inputCls} placeholder="Value" />
            <select value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls + " mt-2"}>
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <button onClick={swap} className={ghostBtnCls + " mb-1 h-10 px-3"} title="Swap units">
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <div>
            <label className={labelCls}>To</label>
            <div className={inputCls + " font-bold text-base truncate"}>{result === null ? "—" : fmtNum(result)}</div>
            <select value={to} onChange={(e) => setTo(e.target.value)} className={inputCls + " mt-2"}>
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/60">
          <p className="text-sm text-muted-foreground font-medium truncate">
            {result === null ? "Enter a value to convert" : `${fmtNum(parseFloat(value) || 0)} ${from} = ${fmtNum(result)} ${to}`}
          </p>
          <CopyButton text={result === null ? "" : String(result)} label="Copy result" />
        </div>
      </div>
    </div>
  );
}