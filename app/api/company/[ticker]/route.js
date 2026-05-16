// ============================================
// API: /api/company/[ticker]
// Returns: Full company profile + recent mentions
// ============================================

import { NextResponse } from "next/server";
import supabase from "../../../../database/client.js";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { ticker } = params;
  const upperTicker = ticker.toUpperCase();

  try {
    // 1. Get company
    const { data: company, error } = await supabase
      .from("wae_companies")
      .select("*")
      .eq("ticker", upperTicker)
      .single();

    if (error || !company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    // 2. Get recent events mentioning this company
    const { data: recentEvents } = await supabase
      .from("wae_event_company_links")
      .select(`
        link_strength,
        link_type,
        mention_count,
        impact_score,
        impact_channels,
        wae_events (
          id, title, heat_score, category, region,
          source_name, published_at, ingested_at, url
        )
      `)
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // 3. Get peer companies (same sector + country)
    const { data: peers } = await supabase
      .from("wae_companies")
      .select("ticker, name, sector, market_cap_usd, country")
      .eq("sector", company.sector)
      .eq("country", company.country)
      .neq("id", company.id)
      .order("market_cap_usd", { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        company,
        recent_events: (recentEvents || []).map(e => ({
          ...e.wae_events,
          link_strength: e.link_strength,
          impact_score: e.impact_score,
          impact_channels: e.impact_channels,
        })),
        peers: peers || [],
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
