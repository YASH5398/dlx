import { load as loadCheerio } from 'cheerio';

let cachedContext = null;

async function fetchPage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'DLX-SupportBot/1.0' } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const html = await res.text();
  const $ = loadCheerio(html);
  // Remove script/style/nav
  ['script', 'style', 'nav', 'footer'].forEach((sel) => $(sel).remove());
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return text;
}

export async function getSiteContext() {
  if (cachedContext) return cachedContext;
  const base = 'https://digilinex.com';
  const urls = [
    base,
    `${base}/pricing`,
    `${base}/services`,
    `${base}/blogs`,
    `${base}/tutorials`,
    `${base}/docs`,
  ];
  const parts = [];
  for (const u of urls) {
    try {
      const t = await fetchPage(u);
      parts.push({ url: u, text: t });
    } catch (e) {
      // ignore failures for optional pages
    }
  }
  cachedContext = parts;
  return cachedContext;
}

export function retrieveContext(contextParts, query) {
  // naive relevance: rank by number of overlapping words
  const q = (query || '').toLowerCase().split(/\W+/).filter(Boolean);
  const scored = contextParts.map((p) => {
    const t = p.text.toLowerCase();
    const score = q.reduce((acc, w) => acc + (t.includes(w) ? 1 : 0), 0);
    return { ...p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3).map((p) => `From ${p.url}:\n${p.text.slice(0, 5000)}`);
  return top.join('\n\n');
}