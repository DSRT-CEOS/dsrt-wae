import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { default: supabase } = await import("../database/client.js");
const { linkEvent } = await import("../modules/processing/linker.js");

// Find a Trump-Taiwan event
const { data: events } = await supabase
  .from("wae_events")
  .select("*")
  .ilike("title", "%trump%taiwan%")
  .limit(1);

if (!events || events.length === 0) {
  console.log("No Trump-Taiwan event found");
  process.exit(0);
}

const event = events[0];
console.log("\n=== TESTING EVENT ===");
console.log("ID:", event.id);
console.log("Title:", event.title);
console.log("Summary:", (event.summary || "").substring(0, 200));
console.log("Countries:", event.countries);

console.log("\n=== RUNNING LINKER ===");
const matches = await linkEvent(event);

console.log(`\nFound ${matches.length} company matches:`);
matches.forEach(m => {
  console.log(`  ${m.matched_alias} (strength: ${m.link_strength}, mentions: ${m.mention_count}, in: ${m.mentioned_in})`);
});

// Verify saved
const { count } = await supabase
  .from("wae_event_company_links")
  .select("*", { count: "exact", head: true })
  .eq("event_id", event.id);

console.log(`\nLinks in DB for this event: ${count}`);
