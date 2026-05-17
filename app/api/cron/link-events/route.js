// ============================================
// LINKING CRON — Runs separately from engine
// Links recent unlinked high-heat events
// ============================================

import { NextResponse } from "next/server";
import supabase from "../../../../database/client.js";
import { linkEvents } from "../../../../modules/processing/linker.js";

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
    // Find recent events that have NO links yet (heat >= 6)
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    
    const { data: events } = await supabase
      .from("wae_events")
      .select("id, title, summary, content, region, countries, heat_score")
      .gte("heat_score", 6)
      .gte("ingested_at", since)
      .order("heat_score", { ascending: false })
      .limit(15); // Max 15 events per run (LLM rate limits)

    if (!events || events.length === 0) {
      return NextResponse.json({ 
        status: "success", 
        message: "No new high-heat events to link",
        duration: "0s",
      });
    }

    // Check which already have links
    const eventIds = events.map(e => e.id);
    const { data: existingLinks } = await supabase
      .from("wae_event_company_links")
      .select("event_id")
      .in("event_id", eventIds);
    
    const linkedIds = new Set((existingLinks || []).map(l => l.event_id));
    const unlinkedEvents = events.filter(e => !linkedIds.has(e.id));

    if (unlinkedEvents.length === 0) {
      return NextResponse.json({
        status: "success",
        message: "All high-heat events already linked",
        duration: ((Date.now() - startTime) / 1000).toFixed(1) + "s",
      });
    }

    const result = await linkEvents(unlinkedEvents);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    return NextResponse.json({
      status: "success",
      duration: duration + "s",
      events_processed: unlinkedEvents.length,
      events_linked: result.linked,
      total_links: result.totalLinks,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", error: err.message },
      { status: 500 }
    );
  }
}
