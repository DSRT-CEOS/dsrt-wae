// ============================================
// TEST: All Data Sources
// Verifies REAL events flow from REAL APIs
// ============================================

import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { fetchEvents: fetchGDELT } = await import("../modules/sources/gdelt.js");
const { fetchEvents: fetchRSS } = await import("../modules/sources/rss-global.js");
const { default: logger } = await import("../core/logger.js");

async function testSources() {
  console.log("\n");
  logger.section("TEST", "DSRT WAE — Real Source Test");

  // ── TEST GDELT ──
  console.log("\n📡 SOURCE 1: GDELT PROJECT");
  console.log("─────────────────────────────");
  console.log("Connecting to global event database...\n");
  
  const gdeltStart = Date.now();
  const gdeltEvents = await fetchGDELT();
  const gdeltTime = ((Date.now() - gdeltStart) / 1000).toFixed(1);

  if (gdeltEvents.length > 0) {
    console.log(`✅ GDELT WORKS — ${gdeltEvents.length} events in ${gdeltTime}s`);
    console.log("\n📋 Sample event:");
    console.log("   Title:    ", gdeltEvents[0].title.substring(0, 70));
    console.log("   Source:   ", gdeltEvents[0].source_name);
    console.log("   Country:  ", gdeltEvents[0].countries[0] || "—");
    console.log("   Theme:    ", gdeltEvents[0].raw_category);
    console.log("   Published:", gdeltEvents[0].published_at);
  } else {
    console.log("❌ GDELT returned 0 events");
  }

  // ── TEST RSS ──
  console.log("\n\n📰 SOURCE 2: GLOBAL RSS FEEDS");
  console.log("─────────────────────────────");
  console.log("Fetching from major world outlets...\n");

  const rssStart = Date.now();
  const rssEvents = await fetchRSS();
  const rssTime = ((Date.now() - rssStart) / 1000).toFixed(1);

  if (rssEvents.length > 0) {
    console.log(`✅ RSS WORKS — ${rssEvents.length} events in ${rssTime}s`);
    
    // Show breakdown by source
    const sourceBreakdown = {};
    rssEvents.forEach(e => {
      sourceBreakdown[e.source_name] = (sourceBreakdown[e.source_name] || 0) + 1;
    });
    
    console.log("\n📊 Source breakdown:");
    Object.entries(sourceBreakdown).forEach(([src, count]) => {
      console.log(`   ${src.padEnd(25)} ${count} events`);
    });

    console.log("\n📋 Sample event:");
    console.log("   Title:    ", rssEvents[0].title.substring(0, 70));
    console.log("   Source:   ", rssEvents[0].source_name);
    console.log("   URL:      ", rssEvents[0].url.substring(0, 70));
    console.log("   Published:", rssEvents[0].published_at);
  } else {
    console.log("❌ RSS returned 0 events");
  }

  // ── COMBINED TOTALS ──
  const total = gdeltEvents.length + rssEvents.length;
  
  console.log("\n");
  logger.divider();
  console.log("📊 TOTAL RAW EVENTS:", total);
  console.log("📡 GDELT:", gdeltEvents.length);
  console.log("📰 RSS:  ", rssEvents.length);
  logger.divider();

  if (total >= 50) {
    console.log("\n🎉 EXCELLENT — System pulling real-world data");
    console.log("✅ Day 3 sources are LIVE");
  } else if (total > 0) {
    console.log("\n⚠️  Sources working but low volume");
    console.log("   This is OK — depends on news cycle");
  } else {
    console.log("\n❌ NO EVENTS FETCHED — check internet/firewall");
  }
  console.log("\n");
}

testSources().catch(err => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
