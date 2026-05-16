// ============================================
// API: /api/event/[id]
// Returns: Single event + related events + cluster
// ============================================

import { NextResponse } from "next/server";
import supabase from "../../../../database/client.js";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { id } = params;

  try {
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

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: related } = await supabase
      .from("wae_events")
      .select("id, title, heat_score, category, region, source_name, published_at, url")
      .or(`category.eq.${event.category},region.eq.${event.region}`)
      .neq("id", id)
      .gte("ingested_at", oneDayAgo)
      .order("heat_score", { ascending: false })
      .limit(10);

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
