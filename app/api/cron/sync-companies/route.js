import { NextResponse } from "next/server";
import supabase from "../../../../database/client.js";
import { fetchQuote, fetchKeyStats } from "../../../../modules/data/yahoo-finance.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");
    if (querySecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startTime = Date.now();
  
  try {
    // Sync top 30 companies (Vercel 60s limit, can't do 139)
    const { data: companies } = await supabase
      .from("wae_companies")
      .select("id, ticker, exchange")
      .eq("is_active", true)
      .order("market_cap_usd", { ascending: false })
      .limit(30);
    
    if (!companies) {
      return NextResponse.json({ status: "error", error: "No companies" });
    }
    
    let success = 0;
    let failed = 0;
    
    for (const c of companies) {
      try {
        const [quote, stats] = await Promise.all([
          fetchQuote(c.ticker, c.exchange),
          fetchKeyStats(c.ticker, c.exchange),
        ]);
        
        if (quote) {
          await supabase.from("wae_company_prices").insert({
            company_id: c.id, ticker: c.ticker,
            price: quote.price, currency: quote.currency,
            change_amount: quote.change_amount, change_percent: quote.change_percent,
            open_price: quote.open_price, high_price: quote.high_price,
            low_price: quote.low_price, prev_close: quote.prev_close,
            volume: quote.volume, week_52_high: quote.week_52_high, week_52_low: quote.week_52_low,
            market_cap_usd: stats?.market_cap_usd, pe_ratio: stats?.pe_ratio,
            eps: stats?.eps, dividend_yield: stats?.dividend_yield, beta: stats?.beta,
            source: "yahoo",
          });
          success++;
        } else {
          failed++;
        }
        
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        failed++;
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    return NextResponse.json({
      status: "success",
      duration: `${duration}s`,
      synced: success,
      failed,
      total: companies.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ status: "error", error: err.message }, { status: 500 });
  }
}
