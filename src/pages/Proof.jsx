import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ProofCard from "@/components/proof/ProofCard";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function Proof() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    base44.entities.Proof.filter({ visible: true }, { sort: "sort_order", limit: 100 })
      .then((page) => setItems(page.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 mb-10"
        style={MONT}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground" style={MONT}>
            Proof
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium tracking-wide uppercase mt-2" style={MONT}>
            Certificates and verified documents
          </p>
        </div>

        {items === null ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-border/70 rounded-xl px-6 py-20 text-center">
            <p className="text-sm md:text-base font-bold tracking-widest uppercase text-foreground/60" style={MONT}>
              This Page is currently under construction
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {items.map((item) => (
              <ProofCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}