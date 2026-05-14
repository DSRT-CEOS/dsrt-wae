// ============================================
// TEST: Full Engine Run
// Ingest -> Process -> AI Briefing -> Save to DB
// ============================================

import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { runCycle } = await import("../core/engine.js");
const { default: logger } = await import("../core/logger.js");

async function testEngine() {
  console.log("\n");
  logger.section("TEST", "DSRT WAE — FULL ENGINE TEST");

  console.log("\n⚡ Running complete intelligence cycle...");
  console.log("   This will take 30-60 seconds.");
  console.log("   Steps: Ingest -> Dedup -> Classify -> Score -> Save -> AI Brief\n");

  const result = await runCycle();

  if (result.success) {
    console.log("\n");
    logger.divider();
    console.log("🎉 CYCLE SUCCESSFUL");
    logger.divider();
    
    console.log("\n📊 STATISTICS:");
    console.log(`   Cycle ID:        ${result.cycleId}`);
    console.log(`   Duration:        ${result.duration}`);
    console.log(`   Raw events:      ${result.stats.rawEvents}`);
    console.log(`   Unique events:   ${result.stats.uniqueEvents}`);
    console.log(`   Stored in DB:    ${result.stats.storedEvents}`);
    console.log(`   Global heat:     ${result.stats.globalHeat}/10`);
    console.log(`   Sources:         ${result.stats.sourcesHit.join(", ")}`);
    
    if (result.stats.errors.length > 0) {
      console.log(`   Errors:          ${result.stats.errors.length}`);
    }

    console.log("\n🤖 AI BRIEFING:");
    console.log("─────────────────────────");
    console.log(result.briefing);
    console.log("─────────────────────────");

    console.log("\n✅ Check Supabase Table Editor:");
    console.log("   - wae_events: Should have new events");
    console.log("   - wae_cycles: Should have this cycle logged");
    console.log("\n");
  } else {
    console.log("\n❌ CYCLE FAILED");
  }
}

testEngine().catch(err => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
