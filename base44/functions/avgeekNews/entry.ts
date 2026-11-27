import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { clientIp, isRateLimited, noteAttempt } from '../../shared/guard.ts';

// Headlines for the AvGeek Command Center terminal. Google News refuses requests from the
// platform's addresses and the keyless RSS bridges are rate limited, so the terminal reads the
// aviation newsrooms directly. Results are cached for a few minutes, so a page full of visitors
// costs a handful of outbound requests, not a handful each.
const FEEDS = [
  { name: 'Simple Flying', url: 'https://simpleflying.com/feed/' },
  { name: 'AVweb', url: 'https://www.avweb.com/feed/' },
  { name: 'AeroTime', url: 'https://www.aerotime.aero/feed' },
  { name: 'NASA', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' },
  { name: 'AirlineGeeks', url: 'https://airlinegeeks.com/feed/' },
  { name: 'FLYING', url: 'https://www.flyingmag.com/feed/' },
];

const CACHE_MS = 3 * 60 * 1000;
const PER_FEED = 25;
const MAX_ITEMS = 150;
const WINDOW_MS = 5 * 60 * 1000;

let cache = { at: 0, items: [], feeds: 0 };

function decode(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function plain(value) {
  return decode(String(value || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function tag(block, name) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? decode(match[1]).trim() : '';
}

function parseFeed(xml, name) {
  const items = [];
  for (const block of xml.split('<item>').slice(1, PER_FEED + 1)) {
    const chunk = block.split('</item>')[0];
    const title = plain(tag(chunk, 'title'));
    const link = tag(chunk, 'link');
    if (!title || !/^https?:\/\//i.test(link)) continue;
    const published = Date.parse(tag(chunk, 'pubDate'));
    items.push({
      title,
      link,
      source: plain(tag(chunk, 'source')) || name,
      published: Number.isFinite(published) ? new Date(published).toISOString() : '',
      snippet: plain(tag(chunk, 'description')).slice(0, 220),
    });
  }
  return items;
}

async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; AvGeekCommandCenter/1.0)' },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`${feed.name} ${res.status}`);
  const items = parseFeed(await res.text(), feed.name);
  if (items.length === 0) throw new Error(`${feed.name} returned nothing`);
  return items;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const key = `avgeek:${clientIp(req)}`;
    if (
      await isRateLimited(base44, key, {
        max: 30,
        windowMs: WINDOW_MS,
        globalMax: 600,
        scope: 'avgeek',
      })
    ) {
      return Response.json({ error: 'Too many refreshes. Try again in a few minutes.' }, { status: 429 });
    }
    await noteAttempt(base44, key, { windowMs: WINDOW_MS, scope: 'avgeek' });

    if (cache.items.length > 0 && Date.now() - cache.at < CACHE_MS) {
      return Response.json({ items: cache.items, feeds: cache.feeds, cached: true });
    }

    const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
    const merged = [];
    let answered = 0;
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        merged.push(...result.value);
        answered += 1;
      }
    }

    const seen = new Set();
    const items = merged
      .filter((item) => {
        const dedupeKey = item.title.toLowerCase();
        if (seen.has(dedupeKey)) return false;
        seen.add(dedupeKey);
        return true;
      })
      .sort((a, b) => (Date.parse(b.published || '') || 0) - (Date.parse(a.published || '') || 0))
      .slice(0, MAX_ITEMS);

    if (items.length > 0) cache = { at: Date.now(), items, feeds: answered };
    return Response.json({ items, feeds: answered, cached: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}