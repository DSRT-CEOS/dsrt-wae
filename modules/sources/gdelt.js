// ============================================
// DSRT WAE — SOURCE: GDELT PROJECT (v1.2)
// ============================================
// Resilient version - skips on rate limit
// Auto-recovers when API quota refreshes
// ============================================

import logger from "../../core/logger.js";

const MOD = "GDELT";

export const MODULE_INFO = {
  id: "gdelt",
  name: "GDELT Project",
  version: "1.2.0",
};

// Simpler queries to reduce API load
const SEARCH_QUERIES = [
  { query: "war OR military attack", theme: "conflict", maxRecords: 15 },
  { query: "sanctions OR diplomacy", theme: "geopolitics", maxRecords: 10 },
  { query: "economy OR trade war", theme: "economy", maxRecords: 10 },
  { query: "nuclear OR missile", theme: "military", maxRecords: 10 },
];

// Track rate limiting
let rateLimitedUntil = 0;

function parseGDELTDate(dateStr) {
  try {
    if (!dateStr || dateStr.length < 15) return new Date().toISOString();
    const y = dateStr.substring(0, 4);
    const m = dateStr.substring(4, 6);
    const d = dateStr.substring(6, 8);
    const h = dateStr.substring(9, 11);
    const min = dateStr.substring(11, 13);
    const s = dateStr.substring(13, 15);
    return `${y}-${m}-${d}T${h}:${min}:${s}Z`;
  } catch {
    return new Date().toISOString();
  }
}

async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DSRT-WAE/1.0)",
        "Accept": "application/json",
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function queryGDELT(searchQuery, theme, maxRecords) {
  try {
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = 
      `https://api.gdeltproject.org/api/v2/doc/doc` +
      `?query=${encodedQuery}` +
      `&mode=ArtList&maxrecords=${maxRecords}` +
      `&format=json&sort=DateDesc&timespan=60min`;

    const response = await fetchWithTimeout(url);

    // Rate limited - back off
    if (response.status === 429) {
      rateLimitedUntil = Date.now() + (60 * 60 * 1000); // 1 hour
      return { rateLimited: true, events: [] };
    }

    if (!response.ok) return { events: [] };

    const text = await response.text();
    if (!text || text.trim().length === 0) return { events: [] };

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { events: [] };
    }

    if (!data.articles || !Array.isArray(data.articles)) {
      return { events: [] };
    }

    const events = data.articles.map((article) => ({
      title: (article.title || "Untitled").trim(),
      summary: article.sourcecountry 
        ? `[${article.sourcecountry}] via ${article.domain || "Unknown"}`
        : "",
      content: "",
      url: article.url || "",
      image_url: article.socialimage || "",
      source_module: "gdelt",
      source_name: article.domain || "Unknown",
      source_url: article.url || "",
      published_at: parseGDELTDate(article.seendate),
      countries: article.sourcecountry ? [article.sourcecountry] : [],
      keywords: [theme],
      raw_category: theme,
      language: article.language || "English",
      tone: article.tone ? parseFloat(article.tone) : 0,
    }));

    return { events };
  } catch {
    return { events: [] };
  }
}

export async function fetchEvents() {
  // Check if we're in rate limit cooldown
  if (Date.now() < rateLimitedUntil) {
    const minsLeft = Math.ceil((rateLimitedUntil - Date.now()) / 60000);
    logger.info(MOD, `Rate limited - skipping (${minsLeft}min cooldown)`);
    return [];
  }

  logger.info(MOD, "Starting GDELT fetch cycle...");
  const startTime = Date.now();
  const allEvents = [];
  let successQueries = 0;
  let hitRateLimit = false;

  for (const { query, theme, maxRecords } of SEARCH_QUERIES) {
    if (hitRateLimit) break; // Stop trying if we hit limit

    const result = await queryGDELT(query, theme, maxRecords);
    
    if (result.rateLimited) {
      hitRateLimit = true;
      logger.warn(MOD, "Rate limited - cooldown for 1 hour");
      break;
    }
    
    if (result.events.length > 0) {
      allEvents.push(...result.events);
      successQueries++;
    }
    
    await new Promise((r) => setTimeout(r, 2000));
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(
    MOD, 
    `Fetched ${allEvents.length} events from ${successQueries}/${SEARCH_QUERIES.length} queries in ${duration}s`
  );
  return allEvents;
}
