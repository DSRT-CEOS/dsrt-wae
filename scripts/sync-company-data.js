// ============================================
// SYNC COMPANY DATA v1.1 — WITH HISTORY
// ============================================

import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, "..", ".env.local") });

const { default: supabase } = await import("../database/client.js");
const { fetchQuote, fetchKeyStats, fetchHistorical } = await import("../modules/data/yahoo-finance.js");

async function syncCompany(company, includeHistory = false) {
  const { ticker, exchange, id } = company;
  
  try {
    const [quote, stats] = await Promise.all([
      fetchQuote(ticker, exchange),
      fetchKeyStats(ticker, exchange),
    ]);
    
    if (!quote && !stats) {
      return { ticker, success: false, reason: "no_data" };
    }
    
    // Save current price
    if (quote) {
      await supabase.from("wae_company_prices").insert({
        company_id: id,
        ticker,
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
        market_cap_usd: stats?.market_cap_usd || null,
        pe_ratio: stats?.pe_ratio || null,
        eps: stats?.eps || null,
        dividend_yield: stats?.dividend_yield || null,
        beta: stats?.beta || null,
        source: "yahoo",
      });
    }
    
    // Save financials
    if (stats) {
      await supabase.from("wae_company_financials").upsert({
        company_id: id,
        ticker,
        period_type: "ttm",
        period_end: new Date().toISOString().split("T")[0],
        fiscal_year: new Date().getFullYear(),
        revenue: stats.revenue,
        ebitda: stats.ebitda,
        gross_margin: stats.gross_margin,
        operating_margin: stats.operating_margin,
        net_margin: stats.profit_margin,
        pe_ratio: stats.pe_ratio,
        pb_ratio: stats.pb_ratio,
        ps_ratio: stats.ps_ratio,
        ev_ebitda: stats.ev_ebitda,
        roe: stats.roe,
        debt_to_equity: stats.debt_to_equity,
        current_ratio: stats.current_ratio,
        free_cash_flow: stats.free_cash_flow,
        operating_cash_flow: stats.operating_cash_flow,
        total_debt: stats.total_debt,
        cash_and_equivalents: stats.total_cash,
        eps_diluted: stats.eps,
        currency: quote?.currency || "USD",
      }, { onConflict: "ticker,period_type,period_end" });
    }
    
    // Save ownership
    if (stats) {
      await supabase.from("wae_company_ownership").upsert({
        company_id: id,
        ticker,
        insider_ownership: stats.held_percent_insiders ? stats.held_percent_insiders * 100 : null,
        institutional_ownership: stats.held_percent_institutions ? stats.held_percent_institutions * 100 : null,
        float_shares: stats.float_shares,
        short_interest: stats.short_percent_of_float ? stats.short_percent_of_float * 100 : null,
        short_ratio: stats.short_ratio,
        as_of_date: new Date().toISOString().split("T")[0],
      }, { onConflict: "ticker,as_of_date" });
    }
    
    // Save analyst ratings
    if (stats?.analyst_count) {
      const ratingMap = {
        strong_buy: "STRONG_BUY", buy: "BUY", hold: "HOLD",
        sell: "SELL", strong_sell: "STRONG_SELL",
        underperform: "SELL", outperform: "BUY",
      };
      const upside = stats.target_mean && quote?.price 
        ? ((stats.target_mean - quote.price) / quote.price * 100) : null;
      
      await supabase.from("wae_analyst_ratings").insert({
        company_id: id,
        ticker,
        consensus_rating: ratingMap[stats.recommendation_key] || "HOLD",
        rating_score: stats.recommendation_mean,
        total_analysts: stats.analyst_count,
        target_price_avg: stats.target_mean,
        target_price_high: stats.target_high,
        target_price_low: stats.target_low,
        target_currency: quote?.currency || "USD",
        upside_percent: upside,
      });
    }
    
    // Update master record
    if (stats?.market_cap_usd) {
      await supabase.from("wae_companies").update({
        market_cap_usd: stats.market_cap_usd,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
    }
    
    // HISTORY — only fetch if requested
    let historyCount = 0;
    if (includeHistory) {
      const bars = await fetchHistorical(ticker, exchange, "1y");
      if (bars.length > 0) {
        // Batch insert in chunks of 100
        const chunks = [];
        for (let i = 0; i < bars.length; i += 100) {
          chunks.push(bars.slice(i, i + 100));
        }
        
        for (const chunk of chunks) {
          const rows = chunk.map(b => ({
            company_id: id,
            ticker,
            date: b.date,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
            volume: b.volume,
            adjusted_close: b.adjusted_close,
          }));
          
          await supabase.from("wae_company_history").upsert(rows, {
            onConflict: "ticker,date",
            ignoreDuplicates: true,
          });
        }
        historyCount = bars.length;
      }
    }
    
    return { 
      ticker, 
      success: true, 
      price: quote?.price,
      change_pct: quote?.change_percent?.toFixed(2),
      pe: stats?.pe_ratio?.toFixed(2),
      analyst_target: stats?.target_mean,
      currency: quote?.currency,
      history_bars: historyCount,
    };
  } catch (err) {
    return { ticker, success: false, reason: err.message };
  }
}

async function syncAll() {
  console.log("\n=== COMPANY DATA SYNC v1.1 ===\n");
  
  const limitArg = process.argv[2];
  const limit = limitArg ? parseInt(limitArg) : 50;
  const fetchHistoryFlag = process.argv.includes("--history");
  
  console.log(`Syncing top ${limit} companies${fetchHistoryFlag ? " WITH 1-year price history" : ""}...\n`);
  
  const { data: companies } = await supabase
    .from("wae_companies")
    .select("id, ticker, exchange, name")
    .eq("is_active", true)
    .order("market_cap_usd", { ascending: false })
    .limit(limit);
  
  if (!companies || companies.length === 0) {
    console.log("No companies found.");
    return;
  }
  
  console.log(`Found ${companies.length} companies\n`);
  
  let success = 0;
  let failed = 0;
  let totalHistoryBars = 0;
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    process.stdout.write(`[${(i + 1).toString().padStart(3)}/${companies.length}] ${company.ticker.padEnd(15)} `);
    
    const result = await syncCompany(company, fetchHistoryFlag);
    
    if (result.success) {
      success++;
      totalHistoryBars += result.history_bars || 0;
      const historyTag = result.history_bars ? `| ${result.history_bars} bars` : "";
      const sym = result.currency === "INR" ? "₹" : result.currency === "EUR" ? "€" : result.currency === "GBP" ? "£" : result.currency === "JPY" ? "¥" : "$";
      console.log(`OK | ${sym}${result.price || "—"} | ${result.change_pct || "—"}% | PE ${result.pe || "—"} | Target ${sym}${result.analyst_target || "—"} ${historyTag}`);
    } else {
      failed++;
      console.log(`FAIL: ${result.reason}`);
    }
    
    await new Promise(r => setTimeout(r, 800));
  }
  
  console.log("\n========================================");
  console.log("SYNC COMPLETE");
  console.log("========================================");
  console.log(`Success: ${success}/${companies.length}`);
  console.log(`Failed: ${failed}`);
  if (fetchHistoryFlag) console.log(`Total history bars: ${totalHistoryBars}`);
  
  const [{ count: priceCount }, { count: finCount }, { count: histCount }] = await Promise.all([
    supabase.from("wae_company_prices").select("*", { count: "exact", head: true }),
    supabase.from("wae_company_financials").select("*", { count: "exact", head: true }),
    supabase.from("wae_company_history").select("*", { count: "exact", head: true }),
  ]);
  
  console.log(`\nDB Totals:`);
  console.log(`  Price snapshots: ${priceCount}`);
  console.log(`  Financial records: ${finCount}`);
  console.log(`  Historical bars: ${histCount}`);
  console.log("\n=== DONE ===\n");
}

syncAll().catch(err => {
  console.error("Sync failed:", err);
  process.exit(1);
});
