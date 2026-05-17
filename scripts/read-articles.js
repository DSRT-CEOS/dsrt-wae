import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { default: supabase } = await import("../database/client.js");

const { data: articles } = await supabase
  .from("dsrt_articles")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(3);

if (!articles || articles.length === 0) {
  console.log("No articles found. Run test-articles.js first.");
  process.exit(0);
}

console.log(`\nFound ${articles.length} articles. Showing each:\n`);

articles.forEach((a, i) => {
  console.log("=".repeat(70));
  console.log(`ARTICLE ${i + 1} / ${articles.length}`);
  console.log("=".repeat(70));
  console.log(`\nTITLE: ${a.title}`);
  console.log(`SUBTITLE: ${a.subtitle || "(none)"}`);
  console.log(`AGENT: ${a.agent_persona}`);
  console.log(`CATEGORY: ${a.category} | REGION: ${a.region}`);
  console.log(`QUALITY: ${a.quality_score} | CONFIDENCE: ${a.confidence_score}`);
  console.log(`READING TIME: ${a.reading_time_minutes} min`);
  console.log(`\n--- LEAD ---`);
  console.log(a.lead_paragraph);
  console.log(`\n--- BODY ---`);
  console.log(a.body_markdown);
  console.log(`\n--- META ---`);
  console.log(`SEO: ${a.meta_description}`);
  console.log(`KEYWORDS: ${(a.keywords || []).join(", ")}`);
  console.log(`TAGS: ${(a.tags || []).join(", ")}`);
  console.log(`\n`);
});
