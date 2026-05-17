import { readFileSync, writeFileSync } from "fs";

// Fix 1: sync-ticker.js log
const f1 = "scripts/sync-ticker.js";
let c1 = readFileSync(f1, "utf-8");
c1 = c1.replace(
  'console.log("Quote:", quote ? `$${quote.price} ${quote.currency}` : "FAILED");',
  `const sym = quote?.currency === "INR" ? "₹" : quote?.currency === "EUR" ? "€" : quote?.currency === "GBP" ? "£" : quote?.currency === "JPY" ? "¥" : "$";
  console.log("Quote:", quote ? \`\${sym}\${quote.price} \${quote.currency}\` : "FAILED");`
);
writeFileSync(f1, c1);
console.log("✓ Fixed sync-ticker.js currency symbol");

// Fix 2: sync-company-data.js log
const f2 = "scripts/sync-company-data.js";
let c2 = readFileSync(f2, "utf-8");
c2 = c2.replace(
  'console.log(`OK | $${result.price || "—"} | ${result.change_pct || "—"}% | PE ${result.pe || "—"} | Target $${result.analyst_target || "—"} ${historyTag}`);',
  `const sym = result.currency === "INR" ? "₹" : result.currency === "EUR" ? "€" : result.currency === "GBP" ? "£" : result.currency === "JPY" ? "¥" : "$";
      console.log(\`OK | \${sym}\${result.price || "—"} | \${result.change_pct || "—"}% | PE \${result.pe || "—"} | Target \${sym}\${result.analyst_target || "—"} \${historyTag}\`);`
);

// Also pass currency through in result
c2 = c2.replace(
  'analyst_target: stats?.target_mean,\n      history_bars: historyCount,',
  `analyst_target: stats?.target_mean,
      currency: quote?.currency,
      history_bars: historyCount,`
);
writeFileSync(f2, c2);
console.log("✓ Fixed sync-company-data.js currency symbol");
