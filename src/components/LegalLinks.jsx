import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function LegalLinks({ className = "" }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Link to="/terms" className="text-[10px] text-blue-600 hover:underline">
        Terms &amp; Conditions
      </Link>
      <Link to="/privacy" className="text-[10px] text-blue-600 hover:underline">
        Privacy Policy
      </Link>
    </div>
  );
}