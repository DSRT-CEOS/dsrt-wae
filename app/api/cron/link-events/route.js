// ============================================
// LINKING CRON v1.1 — Reduced batch + faster
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
  const MAX_DURATION_MS = 50000; // Stop at 50s to avoid timeout
  
  try {
    // Last 6 hours, heat >= 6
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    
    const { data: events } = await supabase
      .from("wae_events")
      .select("id, title, summary, content, region, countries, heat_score")
      .gte("heat_score", 6)
      .gte("ingested_at", since)
      .order("heat_score", { ascending: false })
      .limit(30);

    if (!events || events.length === 0) {
      return NextResponse.json({ 
        status: "success", 
        message: "No high-heat events to process",
        duration: "0s",
      });
    }

    // Filter out already-linked ones
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

    // Process ONE event at a time, stop when approaching timeout
    let linked = 0;
    let totalLinks = 0;
    let processed = 0;
    const { linkEvent } = await import("../../../../modules/processing/linker.js");
    
    for (const event of unlinkedEvents) {
      // Check time budget BEFORE next LLM call
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_DURATION_MS) {
        break; // Stop before timeout
      }
      
      try {
        const matches = await linkEvent(event);
        processed++;
        if (matches.length > 0) {
          linked++;
          totalLinks += matches.length;
        }
      } catch (err) {
        // Continue on individual errors
        processed++;
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    return NextResponse.json({
      status: "success",
      duration: duration + "s",
      events_available: unlinkedEvents.length,
      events_processed: processed,
      events_linked: linked,
      total_links: totalLinks,
      remaining: unlinkedEvents.length - processed,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", error: err.message },
      { status: 500 }
    );
  }
}
