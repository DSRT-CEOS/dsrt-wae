import { readFileSync, writeFileSync } from "fs";

const file = "app/company/[ticker]/page.js";
let content = readFileSync(file, "utf-8");

// Look for any hardcoded "$" symbol that should use currency
// Check if MarketCap inside StatBox uses fixed $
const oldMcap = `<StatBox label="MARKET CAP" value={fmt.money(price?.market_cap_usd || company.market_cap_usd, "USD")} color="#60A5FA" />`;
const newMcap = `<StatBox label="MARKET CAP (USD)" value={fmt.money(price?.market_cap_usd || company.market_cap_usd, "USD")} color="#60A5FA" />`;

if (content.includes(oldMcap)) {
  content = content.replace(oldMcap, newMcap);
  console.log("✓ Renamed MARKET CAP to MARKET CAP (USD) to be explicit");
}

// Ensure the price display uses the correct currency consistently
// fmt.money already handles this, just verify currency is being passed
writeFileSync(file, content);
console.log("✓ Done");
