import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { default: supabase } = await import("../database/client.js");
const { generateBatch } = await import("../modules/global/article-generator.js");

const { data: events } = await supabase
  .from("wae_events")
  .select("*")
  .gte("heat_score", 7)
  .order("heat_score", { ascending: false })
  .limit(10);

console.log(`\nFound ${events?.length || 0} high-heat events`);

if (events && events.length > 0) {
  const result = await generateBatch(events, 3);
  console.log(`\nGenerated: ${result.generated}, Rejected: ${result.rejected}`);
  
  // Show what was published
  const { data: articles } = await supabase
    .from("dsrt_articles")
    .select("title, agent_persona, quality_score, confidence_score, reading_time_minutes")
    .order("created_at", { ascending: false })
    .limit(5);
  
  console.log("\nRecent articles:");
  articles?.forEach((a, i) => {
    console.log(`\n${i+1}. ${a.title}`);
    console.log(`   Agent: ${a.agent_persona} | Quality: ${a.quality_score} | Confidence: ${a.confidence_score}`);
  });
}
