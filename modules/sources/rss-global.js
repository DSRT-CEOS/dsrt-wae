// ============================================
// DSRT WAE — SOURCE: GLOBAL RSS FEEDS (v1.1)
// ============================================
// Expanded to 20+ feeds for richer coverage
// ============================================

import RSSParser from "rss-parser";
import logger from "../../core/logger.js";

const MOD = "RSS";

export const MODULE_INFO = {
  id: "rss-global",
  name: "Global RSS Feeds",
  version: "1.1.0",
};

const parser = new RSSParser({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; DSRT-WAE/1.0)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
});

const RSS_FEEDS = [
  // ── GLOBAL MAJORS ──
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", name: "BBC World", region: "Global", type: "general" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", name: "NYT World", region: "Global", type: "general" },
  { url: "https://www.theguardian.com/world/rss", name: "Guardian World", region: "Europe", type: "general" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", name: "Al Jazeera", region: "Middle East", type: "general" },
  { url: "https://www.france24.com/en/rss", name: "France24", region: "Europe", type: "general" },
  
  // ── REGIONAL ──
  { url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms", name: "Times of India World", region: "South Asia", type: "general" },
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", name: "BBC Business", region: "Global", type: "economy" },
  { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", name: "BBC Tech", region: "Global", type: "technology" },
  { url: "https://feeds.bbci.co.uk/news/politics/rss.xml", name: "BBC Politics", region: "Europe", type: "geopolitics" },
  
  // ── DEFENSE & SECURITY ──
  { url: "https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml", name: "Defense News", region: "Global", type: "military" },
  
  // ── ECONOMY & MARKETS ──
  { url: "https://feeds.bloomberg.com/markets/news.rss", name: "Bloomberg Markets", region: "Global", type: "economy" },
  { url: "https://feeds.bloomberg.com/politics/news.rss", name: "Bloomberg Politics", region: "Global", type: "geopolitics" },
  
  // ── ALTERNATIVE PERSPECTIVES ──
  { url: "https://www.rt.com/rss/news/", name: "RT News", region: "Europe", type: "general" },
  { url: "https://sputniknews.com/export/rss2/archive/index.xml", name: "Sputnik", region: "Europe", type: "general" },
  
  // ── REGIONAL ASIA ──
  { url: "https://www.scmp.com/rss/91/feed", name: "SCMP", region: "East Asia", type: "general" },
  
  // ── REUTERS-LIKE ──
  { url: "https://www.cbsnews.com/latest/rss/world", name: "CBS World", region: "Global", type: "general" },
  { url: "https://abcnews.go.com/abcnews/internationalheadlines", name: "ABC International", region: "Global", type: "general" },
  
  // ── DW (Deutsche Welle) ──
  { url: "https://rss.dw.com/rdf/rss-en-world", name: "DW World", region: "Europe", type: "general" },
];

async function fetchFeed(feed) {
  try {
    const result = await parser.parseURL(feed.url);
    if (!result.items || result.items.length === 0) {
      return [];
    }

    return result.items.slice(0, 8).map((item) => ({
      title: (item.title || "Untitled").trim(),
      summary: (item.contentSnippet || item.content || "")
        .substring(0, 500)
        .trim(),
      content: item.content || "",
      url: item.link || "",
      image_url: item.enclosure?.url || "",
      source_module: "rss-global",
      source_name: feed.name,
      source_url: feed.url,
      published_at: item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date().toISOString(),
      countries: [],
      keywords: Array.isArray(item.categories) ? item.categories.slice(0, 5) : [],
      raw_category: feed.type,
    }));
  } catch (err) {
    logger.warn(MOD, `Failed: ${feed.name} (${err.message.substring(0, 50)})`);
    return [];
  }
}

export async function fetchEvents() {
  logger.info(MOD, `Fetching ${RSS_FEEDS.length} RSS feeds in parallel...`);
  const startTime = Date.now();

  const results = await Promise.allSettled(
    RSS_FEEDS.map((feed) => fetchFeed(feed))
  );

  const allEvents = [];
  let successCount = 0;

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value.length > 0) {
      allEvents.push(...result.value);
      successCount++;
    }
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(
    MOD,
    `Got ${allEvents.length} events from ${successCount}/${RSS_FEEDS.length} feeds in ${duration}s`
  );

  return allEvents;
}
