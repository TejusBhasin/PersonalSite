import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

// Personalization for the hidden /invidious page. Everything is stored in
// the browser first (cookie-style local storage); when the visitor is signed
// in to the site account, prefs also sync to their private InvidiousProfile
// record and merge across devices.

const STORAGE_KEY = "invidious_prefs_v1";

const EMPTY = {
  history: [],
  liked: [],
  shorts_topics: [],
  recent_searches: []
};

const readLocal = () => {
  try {
    return { ...EMPTY, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch {
    return { ...EMPTY };
  }
};

const mergeByVideo = (a = [], b = [], cap = 100) => {
  const seen = new Set();
  const out = [];
  for (const item of [...(a || []), ...(b || [])]) {
    if (!item || !item.videoId || seen.has(item.videoId)) continue;
    seen.add(item.videoId);
    out.push(item);
  }
  return out.slice(0, cap);
};

const byNewest = (list) => [...list].sort((x, y) => (y.at || 0) - (x.at || 0));

export default function useInvidiousPrefs() {
  const [prefs, setPrefs] = useState(EMPTY);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const userRef = useRef(null);
  const profileIdRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = readLocal();
      let me = null;
      try {
        me = await base44.auth.me();
      } catch {
        me = null;
      }
      if (cancelled) return;
      let merged = local;
      if (me) {
        userRef.current = me;
        try {
          const { items } = await base44.entities.InvidiousProfile.filter({}, { limit: 1 });
          const rec = items && items[0];
          if (rec) {
            profileIdRef.current = rec.id;
            let remote = {};
            try {
              remote = JSON.parse(rec.data) || {};
            } catch {
              remote = {};
            }
            merged = {
              history: byNewest(mergeByVideo(remote.history, local.history, 200)),
              liked: mergeByVideo(remote.liked, local.liked, 100),
              shorts_topics: [...new Set([...(local.shorts_topics || []), ...(remote.shorts_topics || [])])].slice(0, 12),
              recent_searches: [...new Set([...(local.recent_searches || []), ...(remote.recent_searches || [])])].slice(0, 8)
            };
          }
        } catch {
          // profile unavailable; stay local
        }
      }
      setPrefs(merged);
      setUser(me);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, []);

  const persist = (next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage blocked or full; account sync still applies
    }
    if (!userRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const payload = { data: JSON.stringify(next) };
        if (profileIdRef.current) {
          await base44.entities.InvidiousProfile.update(profileIdRef.current, payload);
        } else {
          const created = await base44.entities.InvidiousProfile.create(payload);
          profileIdRef.current = created?.id ?? null;
        }
      } catch {
        // offline or anonymous; local storage already has the data
      }
    }, 800);
  };

  const update = useCallback((updater) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updater(prev) };
      persist(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recordWatch = useCallback((item) => {
    if (!item || !item.videoId) return;
    update((p) => ({
      history: [
        {
          videoId: item.videoId,
          title: item.title || "",
          author: item.author || "",
          lengthSeconds: item.lengthSeconds || 0,
          at: Date.now()
        },
        ...p.history.filter((h) => h.videoId !== item.videoId)
      ].slice(0, 200)
    }));
  }, [update]);

  const toggleLike = useCallback((item) => {
    if (!item || !item.videoId) return;
    update((p) => {
      const has = p.liked.some((l) => l.videoId === item.videoId);
      return {
        liked: has
          ? p.liked.filter((l) => l.videoId !== item.videoId)
          : [{ videoId: item.videoId, title: item.title || "", author: item.author || "" }, ...p.liked].slice(0, 100)
      };
    });
  }, [update]);

  const addTopic = useCallback((topic) => {
    const t = (topic || "").trim();
    if (!t) return;
    update((p) => ({
      shorts_topics: [t, ...p.shorts_topics.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 12)
    }));
  }, [update]);

  const addRecentSearch = useCallback((q) => {
    const t = (q || "").trim();
    if (!t) return;
    update((p) => ({
      recent_searches: [t, ...p.recent_searches.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8)
    }));
  }, [update]);

  const clearHistory = useCallback(() => {
    update((p) => ({ history: [] }));
  }, [update]);

  return { prefs, ready, user, recordWatch, toggleLike, addTopic, addRecentSearch, clearHistory };
}