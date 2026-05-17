import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { generateDailyBrief } = await import("../modules/global/daily-brief.js");

console.log("\nForcing regeneration of today's brief...\n");
const brief = await generateDailyBrief(true);  // force = true

if (brief) {
  console.log("\n========================================");
  console.log("✓ BRIEF GENERATED SUCCESSFULLY");
  console.log("========================================");
  console.log(`Date: ${brief.brief_date}`);
  console.log(`Heat: ${brief.global_heat_index} (${brief.threat_level})`);
  console.log(`Headlines: ${brief.headlines?.length || 0}`);
  console.log(`\n=== BODY PREVIEW ===\n`);
  console.log(brief.body_markdown.substring(0, 1500));
  console.log("\n...(truncated)");
} else {
  console.log("\n❌ Brief generation failed completely");
}
