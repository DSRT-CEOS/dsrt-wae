// Sync ONE specific ticker with history
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { default: supabase } = await import("../database/client.js");
const { fetchQuote, fetchKeyStats, fetchHistorical } = await import("../modules/data/yahoo-finance.js");

const ticker = process.argv[2];
if (!ticker) {
  console.log("Usage: node scripts/sync-ticker.js TICKER");
  process.exit(1);
}

async function sync() {
  console.log(`\nSyncing ${ticker.toUpperCase()}...\n`);
  
  const { data: company } = await supabase
    .from("wae_companies")
    .select("id, ticker, exchange")
    .eq("ticker", ticker.toUpperCase())
    .single();
  
  if (!company) {
    console.log("Company not found");
    return;
  }
  
  const [quote, stats, history] = await Promise.all([
    fetchQuote(company.ticker, company.exchange),
    fetchKeyStats(company.ticker, company.exchange),
    fetchHistorical(company.ticker, company.exchange, "1y"),
  ]);
  
  const sym = quote?.currency === "INR" ? "₹" : quote?.currency === "EUR" ? "€" : quote?.currency === "GBP" ? "£" : quote?.currency === "JPY" ? "¥" : "$";
  console.log("Quote:", quote ? `${sym}${quote.price} ${quote.currency}` : "FAILED");
  console.log("Stats:", stats ? `PE ${stats.pe_ratio}, MCap ${stats.market_cap_usd}` : "FAILED");
  console.log("History:", history.length, "bars");
  
  if (quote) {
    await supabase.from("wae_company_prices").insert({
      company_id: company.id,
      ticker: company.ticker,
      price: quote.price,
      currency: quote.currency,
      change_amount: quote.change_amount,
      change_percent: quote.change_percent,
      open_price: quote.open_price,
      high_price: quote.high_price,
      low_price: quote.low_price,
      prev_close: quote.prev_close,
      volume: quote.volume,
      week_52_high: quote.week_52_high,
      week_52_low: quote.week_52_low,
      market_cap_usd: stats?.market_cap_usd,
      pe_ratio: stats?.pe_ratio,
      eps: stats?.eps,
      dividend_yield: stats?.dividend_yield,
      beta: stats?.beta,
      source: "manual_sync",
    });
    
    if (stats?.market_cap_usd) {
      await supabase.from("wae_companies").update({
        market_cap_usd: stats.market_cap_usd,
        updated_at: new Date().toISOString(),
      }).eq("id", company.id);
    }
  }
  
  if (history.length > 0) {
    const rows = history.map(b => ({
      company_id: company.id,
      ticker: company.ticker,
      date: b.date,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume,
      adjusted_close: b.adjusted_close,
    }));
    
    for (let i = 0; i < rows.length; i += 100) {
      await supabase.from("wae_company_history").upsert(rows.slice(i, i + 100), {
        onConflict: "ticker,date",
        ignoreDuplicates: true,
      });
    }
    console.log(`Saved ${history.length} historical bars`);
  }
  
  console.log("\nDone!");
}

sync().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
