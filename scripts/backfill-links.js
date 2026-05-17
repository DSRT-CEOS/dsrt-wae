// LLM-powered backfill - slower but accurate
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { default: supabase } = await import("../database/client.js");
const { linkEvents, clearCache } = await import("../modules/processing/linker.js");

async function backfill() {
  console.log("\n=== INTELLIGENCE BACKFILL (LLM-Powered) ===\n");

  const limitArg = process.argv[2];
  const limit = limitArg ? parseInt(limitArg) : 50;
  
  console.log(`Processing top ${limit} HIGHEST HEAT events (LLM analysis takes ~2-3s each)\n`);
  console.log(`Estimated time: ${Math.ceil(limit * 3 / 60)} minutes\n`);

  // Get top events by heat (most important to analyze)
  const { data: events, error } = await supabase
    .from("wae_events")
    .select("id, title, summary, content, region, countries, heat_score")
    .order("heat_score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }

  console.log(`Loaded ${events.length} events to analyze\n`);
  clearCache();

  const result = await linkEvents(events);

  console.log("\n========================================");
  console.log("INTELLIGENCE BACKFILL COMPLETE");
  console.log("========================================");
  console.log(`Events processed: ${events.length}`);
  console.log(`Events with company links: ${result.linked}`);
  console.log(`Total links created: ${result.totalLinks}`);
  console.log(`Coverage: ${((result.linked / events.length) * 100).toFixed(1)}%`);
  console.log(`Time: ${result.duration}s`);

  // Top companies
  const { data: allLinks } = await supabase
    .from("wae_event_company_links")
    .select("company_id, impact_score, wae_companies(ticker)")
    .eq("analysis_method", "hybrid_llm")
    .order("impact_score", { ascending: false })
    .limit(2000);

  if (allLinks && allLinks.length > 0) {
    console.log(`\nTOP 15 MOST-IMPACTED COMPANIES (LLM scored):`);
    const counts = {};
    const avgScores = {};
    
    allLinks.forEach(l => {
      const ticker = l.wae_companies?.ticker;
      if (ticker) {
        counts[ticker] = (counts[ticker] || 0) + 1;
        avgScores[ticker] = (avgScores[ticker] || 0) + (l.impact_score || 0);
      }
    });

    Object.entries(counts)
      .map(([t, c]) => ({ ticker: t, count: c, avgScore: (avgScores[t] / c).toFixed(1) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .forEach((c, i) => {
        console.log(`  ${(i + 1).toString().padStart(2)}. ${c.ticker.padEnd(15)} ${c.count} events (avg impact: ${c.avgScore})`);
      });
  }

  console.log("\n=== DONE ===\n");
}

backfill().catch(err => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
