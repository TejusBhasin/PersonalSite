import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function useSiteTexts() {
  const [texts, set] = useState(null);

  useEffect(() => {
    base44.entities.SiteText.list()
      .then((rows) => {
        const map = {};
        rows.forEach((r) => { map[r.key] = r.value; });
        set(map);
      })
      .catch(() => set({}));
  }, []);

  return texts;
}