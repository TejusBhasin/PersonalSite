import { AlertTriangle } from "lucide-react";

export default function VidiousNotice() {
  return (
    <section className="border border-neutral-800 bg-neutral-900/60 rounded-lg px-4 py-3 flex gap-3">
      <AlertTriangle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
      <p className="text-xs text-neutral-400 leading-relaxed">
        This page provides access to third-party videos hosted elsewhere, strictly as-is and without warranty.
        You are responsible for your own use of this page; the site owner is not liable for any content or how it is used.
        If YouTube, Google, their affiliates, or any rights holder asks for this page to be removed, it will be taken down.
      </p>
    </section>
  );
}