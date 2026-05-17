// ============================================
// ON-DEMAND COMPANY REFRESH
// Triggered when user opens company page
// Fetches latest price + saves to DB
// ============================================

import { NextResponse } from "next/server";
import supabase from "../../../../../database/client.js";
import { fetchQuote, fetchKeyStats } from "../../../../../modules/data/yahoo-finance.js";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(request, { params }) {
  const { ticker } = params;
  const upperTicker = ticker.toUpperCase();
  
  try {
    // Get company info
    const { data: company } = await supabase
      .from("wae_companies")
      .select("id, ticker, exchange")
      .eq("ticker", upperTicker)
      .single();
    
    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }
    
    // Check freshness — only sync if data is older than 1 min
    const { data: latestPrice } = await supabase
      .from("wae_company_prices")
      .select("fetched_at")
      .eq("ticker", upperTicker)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (latestPrice?.fetched_at) {
      const age = Date.now() - new Date(latestPrice.fetched_at).getTime();
      if (age < 60000) {
        return NextResponse.json({
          success: true,
          cached: true,
          age_seconds: Math.floor(age / 1000),
          message: "Data fresh, no sync needed",
        });
      }
    }
    
    // Fetch fresh data
    let quote = null;
    try {
      quote = await fetchQuote(company.ticker, company.exchange);
    } catch (fetchErr) {
      console.error("[REFRESH] Yahoo fetch error for", company.ticker, fetchErr.message);
    }
    
    if (!quote) {
      return NextResponse.json({ success: false, error: "Failed to fetch quote" });
    }
    
    // Save fresh snapshot
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
      source: "yahoo_ondemand",
    });
    
    return NextResponse.json({
      success: true,
      cached: false,
      data: {
        price: quote.price,
        change_percent: quote.change_percent,
        currency: quote.currency,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
