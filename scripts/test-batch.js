import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { default: supabase } = await import("../database/client.js");
const { generateBatch } = await import("../modules/global/article-generator.js");

console.log("\nGenerating articles from top 10 events...\n");

const { data: events } = await supabase
  .from("wae_events")
  .select("*")
  .gte("heat_score", 6)
  .order("heat_score", { ascending: false })
  .limit(10);

console.log(`Found ${events?.length || 0} events`);

if (events && events.length > 0) {
  const result = await generateBatch(events, 10);
  console.log(`\n=== RESULT ===`);
  console.log(`Generated: ${result.generated}`);
  console.log(`Rejected: ${result.rejected}`);
  console.log(`Rate: ${((result.generated / events.length) * 100).toFixed(0)}% pass rate`);
  
  const { data: articles } = await supabase
    .from("dsrt_articles")
    .select("title, agent_persona, quality_score, confidence_score")
    .order("created_at", { ascending: false })
    .limit(10);
  
  console.log(`\n=== PUBLISHED (${articles?.length || 0}) ===`);
  articles?.forEach((a, i) => {
    console.log(`${i+1}. [${a.agent_persona}] ${a.title}`);
    console.log(`   Quality: ${a.quality_score} | Confidence: ${a.confidence_score}`);
  });
}
