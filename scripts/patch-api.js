import { readFileSync, writeFileSync } from "fs";

const file = "app/api/company/[ticker]/route.js";
let content = readFileSync(file, "utf-8");

// Find where latestPrice is fetched and add validation
const oldQuery = /const \{ data: latestPrice \} = await supabase\s*\.from\("wae_company_prices"\)\s*\.select\("\*"\)\s*\.eq\("ticker", upperTicker\)\s*\.order\("fetched_at", \{ ascending: false \}\)\s*\.limit\(1\)\s*\.maybeSingle\(\);/;

const newQuery = `const { data: latestPrice } = await supabase
      .from("wae_company_prices")
      .select("*")
      .eq("ticker", upperTicker)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // VALIDATE price against most recent chart close
    if (latestPrice?.price) {
      const { data: recentBar } = await supabase
        .from("wae_company_history")
        .select("close")
        .eq("ticker", upperTicker)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (recentBar?.close && recentBar.close > 0) {
        const deviation = Math.abs(latestPrice.price - recentBar.close) / recentBar.close;
        if (deviation > 0.5) {
          // Snapshot is corrupt - use chart close instead
          console.warn(\`[API] \${upperTicker} price \${latestPrice.price} differs from chart \${recentBar.close} by \${(deviation * 100).toFixed(0)}%, using chart\`);
          latestPrice.price = recentBar.close;
          latestPrice.change_amount = null;
          latestPrice.change_percent = null;
          latestPrice._corrected = true;
        }
      }
    }`;

content = content.replace(oldQuery, newQuery);
writeFileSync(file, content);
console.log("✓ Added price validation safety net in company API");
