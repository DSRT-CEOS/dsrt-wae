// Market hours + system health status
import { NextResponse } from "next/server";
import supabase from "../../../database/client.js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    const utcMinutes = hour * 60 + minute;
    
    // Market hours (UTC)
    const markets = [
      { name: "NYSE", open: 14.5 * 60, close: 21 * 60, days: [1,2,3,4,5] }, // 9:30-16:00 EST = 14:30-21:00 UTC
      { name: "NSE", open: 3.75 * 60, close: 10 * 60, days: [1,2,3,4,5] }, // 9:15-15:30 IST = 3:45-10:00 UTC
      { name: "LSE", open: 8 * 60, close: 16.5 * 60, days: [1,2,3,4,5] }, // 8:00-16:30 GMT
      { name: "TSE", open: 0, close: 6 * 60, days: [1,2,3,4,5] }, // 9:00-15:00 JST = 0:00-6:00 UTC
    ];
    
    const status = markets.map(m => ({
      name: m.name,
      open: m.days.includes(day) && utcMinutes >= m.open && utcMinutes <= m.close,
    }));
    
    // Last cron run times
    const { data: lastCycle } = await supabase
      .from("wae_cycles")
      .select("started_at, status, events_processed")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const { data: lastPrice } = await supabase
      .from("wae_company_prices")
      .select("fetched_at, ticker")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    return NextResponse.json({
      success: true,
      data: {
        markets: status,
        last_event_cycle: lastCycle,
        last_price_sync: lastPrice,
        server_time: now.toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
