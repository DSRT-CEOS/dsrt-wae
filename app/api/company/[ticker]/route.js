import { NextResponse } from "next/server";
import supabase from "../../../../database/client.js";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { ticker } = params;
  const upperTicker = ticker.toUpperCase();

  try {
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

    // Recent events with LLM reasoning
    const { data: links } = await supabase
      .from("wae_event_company_links")
      .select(`
        link_strength,
        link_type,
        mention_count,
        impact_score,
        impact_channels,
        llm_reasoning,
        wae_events (
          id, title, summary, heat_score, category, region,
          source_name, published_at, ingested_at, url, countries
        )
      `)
      .eq("company_id", company.id)
      .order("impact_score", { ascending: false, nullsLast: true })
      .limit(50);

    const recentEvents = (links || [])
      .filter(l => l.wae_events)
      .map(l => ({
        ...l.wae_events,
        link_strength: l.link_strength,
        impact_score: l.impact_score,
        impact_channels: l.impact_channels,
        llm_reasoning: l.llm_reasoning,
      }));

    const { data: peers } = await supabase
      .from("wae_companies")
      .select("ticker, name, sector, market_cap_usd, country")
      .eq("sector", company.sector)
      .eq("country", company.country)
      .neq("id", company.id)
      .order("market_cap_usd", { ascending: false })
      .limit(8);

    return NextResponse.json({
      success: true,
      data: {
        company,
        recent_events: recentEvents,
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
