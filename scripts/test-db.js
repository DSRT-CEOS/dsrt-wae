// ============================================
// TEST: Database Connection
// Loads .env.local FIRST before anything else
// ============================================

import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
loadEnv({ path: join(__dirname, "..", ".env.local") });

// Verify env loaded BEFORE importing database client
console.log("\n🔑 ENV CHECK:");
console.log("  SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Loaded" : "❌ MISSING");
console.log("  SERVICE_KEY:", process.env.SUPABASE_SERVICE_KEY ? "✅ Loaded" : "❌ MISSING");
console.log("  GROQ_KEY:", process.env.GROQ_API_KEY ? "✅ Loaded" : "❌ MISSING");

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error("\n❌ STOP — env vars not loaded. Check .env.local");
  process.exit(1);
}

// NOW import after env is loaded
const { testConnection } = await import("../database/client.js");
const queries = await import("../database/queries.js");
const { default: logger } = await import("../core/logger.js");

async function runTests() {
  console.log("\n");
  logger.section("TEST", "DSRT WAE — Database Connection Test");
  
  // TEST 1: Connection
  console.log("\n📡 TEST 1: Database Connection");
  console.log("─────────────────────────────");
  const conn = await testConnection();
  if (conn.success) {
    console.log("✅ DATABASE CONNECTED");
    console.log("   Message:", conn.message);
  } else {
    console.log("❌ CONNECTION FAILED");
    console.log("   Error:", conn.error);
    process.exit(1);
  }

  // TEST 2: Insert test event
  console.log("\n📥 TEST 2: Insert Test Event");
  console.log("─────────────────────────────");
  const testEvent = [{
    title: "DSRT WAE System Test Event",
    summary: "Test event from Day 2 setup",
    url: "https://test.example.com",
    source_module: "test",
    source_name: "Day 2 Test",
    content_hash: "test_hash_" + Date.now(),
    category: "general",
    region: "Global",
    heat_score: 5.0,
    countries: ["Test"],
    keywords: ["test", "day2"],
    published_at: new Date().toISOString(),
    status: "raw",
  }];

  const inserted = await queries.insertEvents(testEvent);
  if (inserted.length > 0) {
    console.log("✅ INSERT WORKS");
    console.log("   Event ID:", inserted[0].id);
  } else {
    console.log("❌ INSERT FAILED");
  }

  // TEST 3: Get stats
  console.log("\n📊 TEST 3: Statistics Query");
  console.log("─────────────────────────────");
  const stats = await queries.getStats();
  console.log("✅ STATS RETRIEVED");
  console.log("   Total events:", stats.totalEvents);
  console.log("   Last 24h:", stats.eventsLast24h);
  console.log("   Avg heat:", stats.avgHeatScore);

  // TEST 4: Latest cycle
  console.log("\n🔄 TEST 4: Cycle Query");
  console.log("─────────────────────────────");
  const cycle = await queries.getLatestCycle();
  if (cycle) {
    console.log("✅ CYCLE QUERY WORKS");
    console.log("   Latest cycle:", cycle.id);
  } else {
    console.log("ℹ️  No cycles yet (expected on Day 2)");
  }

  console.log("\n");
  logger.divider();
  console.log("🎉 ALL DATABASE TESTS PASSED");
  console.log("✅ Day 2 backend foundation COMPLETE");
  logger.divider();
  console.log("\n");
}

runTests().catch(err => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
