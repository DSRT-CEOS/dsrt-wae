import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const ticker = "ADANIPORTS.NS";
console.log(`\nDebugging Yahoo for: ${ticker}\n`);

const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`;

const res = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
});

const data = await res.json();
const result = data?.chart?.result?.[0];

if (!result) {
  console.log("No data returned");
  console.log(JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("=== META ===");
console.log("currency:", result.meta.currency);
console.log("regularMarketPrice:", result.meta.regularMarketPrice);
console.log("previousClose:", result.meta.previousClose);
console.log("chartPreviousClose:", result.meta.chartPreviousClose);
console.log("regularMarketDayHigh:", result.meta.regularMarketDayHigh);
console.log("regularMarketDayLow:", result.meta.regularMarketDayLow);
console.log("fiftyTwoWeekHigh:", result.meta.fiftyTwoWeekHigh);
console.log("fiftyTwoWeekLow:", result.meta.fiftyTwoWeekLow);

console.log("\n=== CHART INDICATORS ===");
const closes = result.indicators?.quote?.[0]?.close || [];
console.log("All closes:", closes);

const validCloses = closes.filter(c => c != null);
console.log("Valid closes:", validCloses);
console.log("Last valid close:", validCloses[validCloses.length - 1]);
console.log("Prev valid close:", validCloses[validCloses.length - 2]);

console.log("\n=== TIMESTAMPS ===");
const timestamps = result.timestamp || [];
console.log("Latest timestamp:", new Date(timestamps[timestamps.length - 1] * 1000).toISOString());

console.log("\n=== DIAGNOSIS ===");
const metaPrice = result.meta.regularMarketPrice;
const chartLast = validCloses[validCloses.length - 1];

if (metaPrice && chartLast) {
  const dev = Math.abs(metaPrice - chartLast) / chartLast;
  console.log(`Meta price: ${metaPrice}`);
  console.log(`Chart last: ${chartLast}`);
  console.log(`Deviation: ${(dev * 100).toFixed(1)}%`);
  if (dev > 0.5) {
    console.log("⚠️  HUGE DEVIATION — META PRICE IS WRONG");
    console.log(`   Should use chart last: ₹${chartLast}`);
  } else {
    console.log("✓ Prices consistent");
  }
}
