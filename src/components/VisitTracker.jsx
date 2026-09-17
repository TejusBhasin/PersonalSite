import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function VisitTracker() {
  const location = useLocation();

  useEffect(() => {
    base44.functions.invoke("logVisit", { path: location.pathname }).catch(() => {});
  }, [location.pathname]);

  return null;
}