// Feed ranking for the Vidious shorts doomscroll: engagement-weighted
// scoring with a recency boost, a bonus for true short-form lengths,
// and a random exploration jitter so proven shorts dominate the feed
// while sleepers still surface.

const recencyDays = (publishedText) => {
  if (!publishedText || typeof publishedText !== "string") return null;
  const m = publishedText.match(/(\d+)\s*(second|minute|hour|day|week|month|year)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const mult = { second: 1 / 86400, minute: 1 / 1440, hour: 1 / 24, day: 1, week: 7, month: 30, year: 365 }[unit];
  return n * mult;
};

export function scoreShort(short) {
  let score = Math.log10((short.viewCount || 0) + 1);
  const days = recencyDays(short.publishedText);
  if (days !== null) score += Math.max(0, 5 - Math.log10(days + 1) * 4);
  if (short.lengthSeconds > 0 && short.lengthSeconds <= 60) score += 1.5;
  return score;
}

// Dedupes against everything the session has already served, ranks by
// score plus exploration jitter, returns the ordered queue slice.
export function buildQueue(items, seenIds) {
  return items
    .filter((s) => s && s.videoId && !seenIds.has(s.videoId))
    .map((s) => ({ short: s, score: scoreShort(s) + Math.random() * 1.2 }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.short);
}