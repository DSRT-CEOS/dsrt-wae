// ============================================
// DSRT GLOBAL — Article Publishing Cron
// Runs every 30 minutes
// Picks high-heat events and writes articles
// ============================================

import { NextResponse } from "next/server";
import supabase from "../../../../database/client.js";
import { generateBatch } from "../../../../modules/global/article-generator.js";

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
    // Get high-heat events from last 4 hours
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    
    const { data: events } = await supabase
      .from("wae_events")
      .select("id, title, summary, heat_score, category, region, countries, published_at, url")
      .gte("heat_score", 6)
      .gte("ingested_at", fourHoursAgo)
      .order("heat_score", { ascending: false })
      .limit(20);
    
    if (!events || events.length === 0) {
      return NextResponse.json({
        status: "success",
        message: "No high-heat events to write about",
        duration: "0s",
      });
    }
    
    // Generate up to 5 articles per run
    const result = await generateBatch(events, 5);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    return NextResponse.json({
      status: "success",
      duration: duration + "s",
      events_available: events.length,
      articles_generated: result.generated,
      articles_rejected: result.rejected,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", error: err.message },
      { status: 500 }
    );
  }
}
