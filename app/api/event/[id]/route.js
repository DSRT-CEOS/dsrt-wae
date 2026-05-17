// ============================================
// API: /api/event/[id]  (v2.1)
// Returns: Single event + related + cluster + COMPANIES
// ============================================

import { NextResponse } from "next/server";
import supabase from "../../../../database/client.js";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { id } = params;

  try {
    // 1. Get event
    const { data: event, error: eventError } = await supabase
      .from("wae_events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // 2. Get related events
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: related } = await supabase
      .from("wae_events")
      .select("id, title, heat_score, category, region, source_name, published_at, url")
      .or(`category.eq.${event.category},region.eq.${event.region}`)
      .neq("id", id)
      .gte("ingested_at", oneDayAgo)
      .order("heat_score", { ascending: false })
      .limit(10);

    // 3. Get source cluster
    let cluster = [];
    if (event.source_cluster_id) {
      const { data: clusterEvents } = await supabase
        .from("wae_events")
        .select("id, title, source_name, source_url, url, published_at")
        .eq("source_cluster_id", event.source_cluster_id)
        .neq("id", id)
        .order("published_at", { ascending: true });
      cluster = clusterEvents || [];
    }

    // 4. NEW: Get affected companies for this event
    const { data: companyLinks } = await supabase
      .from("wae_event_company_links")
      .select(`
        link_strength,
        link_type,
        matched_alias,
        mention_count,
        mentioned_in,
        impact_score,
        impact_channels,
        wae_companies (
          id, ticker, name, sector, industry,
          country, market_cap_usd, ceo, headquarters_city,
          website, employees
        )
      `)
      .eq("event_id", id)
      .order("link_strength", { ascending: false });

    const companies = (companyLinks || [])
      .filter(l => l.wae_companies)
      .map(l => ({
        ...l.wae_companies,
        link_strength: l.link_strength,
        link_type: l.link_type,
        matched_alias: l.matched_alias,
        mention_count: l.mention_count,
        mentioned_in: l.mentioned_in,
        impact_score: l.impact_score,
        impact_channels: l.impact_channels,
      }));

    // Fire-and-forget view counter
    supabase
      .from("wae_events")
      .update({ view_count: (event.view_count || 0) + 1 })
      .eq("id", id)
      .then();

    return NextResponse.json({
      success: true,
      data: {
        event,
        related: related || [],
        cluster,
        companies,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
