// ============================================
// FAST PRICE SYNC — Every 5 minutes
// Top 50 companies only (Vercel 60s limit)
// Prices only (no heavy fundamentals)
// ============================================

import { NextResponse } from "next/server";
import supabase from "../../../../database/client.js";
import { fetchQuote } from "../../../../modules/data/yahoo-finance.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("secret") !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startTime = Date.now();
  
  try {
    // Top 50 by market cap (most-watched)
    const { data: companies } = await supabase
      .from("wae_companies")
      .select("id, ticker, exchange")
      .eq("is_active", true)
      .order("market_cap_usd", { ascending: false })
      .limit(50);
    
    if (!companies) {
      return NextResponse.json({ status: "error", error: "No companies" });
    }
    
    // Fetch all quotes in parallel (faster!)
    const results = await Promise.allSettled(
      companies.map(c => 
        fetchQuote(c.ticker, c.exchange).then(quote => ({ company: c, quote }))
      )
    );
    
    let success = 0;
    let failed = 0;
    const updates = [];
    
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.quote) {
        const { company, quote } = r.value;
        updates.push({
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
          source: "yahoo_fast",
        });
        success++;
      } else {
        failed++;
      }
    }
    
    // Batch insert all prices at once
    if (updates.length > 0) {
      await supabase.from("wae_company_prices").insert(updates);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    return NextResponse.json({
      status: "success",
      type: "price_sync",
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
