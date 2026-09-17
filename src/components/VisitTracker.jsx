import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VisitTracker() {
  const location = useLocation();
  const [banned, setBanned] = useState(false);

  useEffect(() => {
    base44.functions.invoke("logVisit", { path: location.pathname })
      .then((res) => {
        if (res?.banned || res?.data?.banned) setBanned(true);
      })
      .catch(() => {});
  }, [location.pathname]);

  if (banned) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
        <X className="w-32 h-32 text-red-600" strokeWidth={4} />
      </div>
    );
  }

  return null;
}