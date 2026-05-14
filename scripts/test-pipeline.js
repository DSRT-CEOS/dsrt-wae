// ============================================
// TEST: Full Processing Pipeline
// Real data from sources -> dedup -> classify -> score
// ============================================

import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { fetchEvents: fetchGDELT } = await import("../modules/sources/gdelt.js");
const { fetchEvents: fetchRSS } = await import("../modules/sources/rss-global.js");
const { deduplicate } = await import("../modules/processing/deduplicator.js");
const { classify } = await import("../modules/processing/classifier.js");
const { scoreHeat } = await import("../modules/processing/heat-scorer.js");
const { default: logger } = await import("../core/logger.js");

async function testPipeline() {
  console.log("\n");
  logger.section("TEST", "DSRT WAE — FULL PIPELINE TEST");

  // PHASE 1: INGEST
  console.log("\n📡 PHASE 1: INGESTION");
  console.log("─────────────────────────");
  
  const [gdeltResult, rssResult] = await Promise.allSettled([
    fetchGDELT(),
    fetchRSS(),
  ]);

  const gdeltEvents = gdeltResult.status === "fulfilled" ? gdeltResult.value : [];
  const rssEvents = rssResult.status === "fulfilled" ? rssResult.value : [];
  const raw = [...gdeltEvents, ...rssEvents];

  console.log(`✅ Total raw events: ${raw.length}`);
  console.log(`   GDELT: ${gdeltEvents.length}`);
  console.log(`   RSS:   ${rssEvents.length}`);

  if (raw.length === 0) {
    console.log("\n❌ No events to process. Exiting.");
    return;
  }

  // PHASE 2: DEDUPLICATE
  console.log("\n🔄 PHASE 2: DEDUPLICATION");
  console.log("─────────────────────────");
  const unique = deduplicate(raw);
  console.log(`✅ ${raw.length} -> ${unique.length} unique events`);

  // PHASE 3: CLASSIFY
  console.log("\n🏷️  PHASE 3: CLASSIFICATION");
  console.log("─────────────────────────");
  const classified = classify(unique);
  
  // Show category distribution
  const catBreakdown = {};
  classified.forEach(e => {
    catBreakdown[e.category] = (catBreakdown[e.category] || 0) + 1;
  });
  console.log("Category breakdown:");
  Object.entries(catBreakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat.padEnd(20)} ${count} events`);
    });

  // Show region distribution
  const regionBreakdown = {};
  classified.forEach(e => {
    regionBreakdown[e.region] = (regionBreakdown[e.region] || 0) + 1;
  });
  console.log("\nRegion breakdown:");
  Object.entries(regionBreakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([region, count]) => {
      console.log(`   ${region.padEnd(20)} ${count} events`);
    });

  // PHASE 4: HEAT SCORE
  console.log("\n🌡️  PHASE 4: HEAT SCORING");
  console.log("─────────────────────────");
  const scored = scoreHeat(classified);

  // PHASE 5: TOP RESULTS
  console.log("\n🔥 TOP 15 EVENTS BY HEAT:");
  console.log("─────────────────────────");
  
  const top = scored
    .sort((a, b) => b.heat_score - a.heat_score)
    .slice(0, 15);

  top.forEach((e, i) => {
    const heat = e.heat_score >= 8 ? "🔴" : 
                 e.heat_score >= 6 ? "🟠" : 
                 e.heat_score >= 4 ? "🟡" : "🔵";
    
    const countries = e.countries.length > 0 
      ? `[${e.countries.slice(0, 2).join(", ")}]` 
      : "";
    
    console.log(`\n${i + 1}. ${heat} ${e.heat_score} | ${e.category} | ${e.region}`);
    console.log(`   ${e.title.substring(0, 90)}`);
    console.log(`   ${countries} via ${e.source_name}`);
  });

  // FINAL SUMMARY
  console.log("\n");
  logger.divider();
  console.log("✅ PIPELINE TEST COMPLETE");
  console.log(`   Raw:        ${raw.length}`);
  console.log(`   Unique:     ${unique.length}`);
  console.log(`   Critical:   ${scored.filter(e => e.heat_score >= 8).length}`);
  console.log(`   High:       ${scored.filter(e => e.heat_score >= 6 && e.heat_score < 8).length}`);
  console.log(`   Moderate:   ${scored.filter(e => e.heat_score >= 4 && e.heat_score < 6).length}`);
  console.log(`   Low:        ${scored.filter(e => e.heat_score < 4).length}`);
  logger.divider();
  console.log("\n🎉 DAY 4 PIPELINE IS WORKING\n");
}

testPipeline().catch(err => {
  console.error("\n❌ FAILED:", err);
  process.exit(1);
});
