import { NextResponse } from "next/server";
import supabase from "../../../../database/client.js";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { ticker } = params;
  const upperTicker = ticker.toUpperCase();

  try {
    // 1. Company basic info
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

    // 2. Latest price + key stats (most recent)
    const { data: latestPrice } = await supabase
      .from("wae_company_prices")
      .select("*")
      .eq("ticker", upperTicker)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Financial fundamentals (latest TTM)
    const { data: financials } = await supabase
      .from("wae_company_financials")
      .select("*")
      .eq("ticker", upperTicker)
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 4. Ownership data (latest)
    const { data: ownership } = await supabase
      .from("wae_company_ownership")
      .select("*")
      .eq("ticker", upperTicker)
      .order("as_of_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 5. Analyst ratings (latest)
    const { data: ratings } = await supabase
      .from("wae_analyst_ratings")
      .select("*")
      .eq("ticker", upperTicker)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 6. Recent events with LLM reasoning
    const { data: links } = await supabase
      .from("wae_event_company_links")
      .select(`
        link_strength, impact_score, impact_channels, llm_reasoning,
        wae_events (id, title, summary, heat_score, category, region,
                    source_name, published_at, ingested_at, url, countries)
      `)
      .eq("company_id", company.id)
      .order("impact_score", { ascending: false, nullsLast: true })
      .limit(30);

    const recentEvents = (links || [])
      .filter(l => l.wae_events)
      .map(l => ({
        ...l.wae_events,
        link_strength: l.link_strength,
        impact_score: l.impact_score,
        impact_channels: l.impact_channels,
        llm_reasoning: l.llm_reasoning,
      }));

    // 7. Sector peers
    const { data: peers } = await supabase
      .from("wae_companies")
      .select("ticker, name, sector, market_cap_usd, country")
      .eq("sector", company.sector)
      .eq("country", company.country)
      .neq("id", company.id)
      .order("market_cap_usd", { ascending: false })
      .limit(8);

    // 8. Relationships (supply chain / competitors / subsidiaries)
    const { data: relationships } = await supabase
      .from("wae_company_relationships")
      .select(`
        relationship_type, strength, description,
        a:wae_companies!company_a (ticker, name, sector),
        b:wae_companies!company_b (ticker, name, sector)
      `)
      .or(`company_a.eq.${company.id},company_b.eq.${company.id}`)
      .limit(20);

    const formattedRelations = (relationships || []).map(r => {
      const isA = r.a?.ticker === upperTicker;
      const other = isA ? r.b : r.a;
      return {
        ticker: other?.ticker,
        name: other?.name,
        sector: other?.sector,
        relationship_type: r.relationship_type,
        strength: r.strength,
        description: r.description,
      };
    }).filter(r => r.ticker);

    return NextResponse.json({
      success: true,
      data: {
        company,
        price: latestPrice,
        financials,
        ownership,
        ratings,
        recent_events: recentEvents,
        peers: peers || [],
        relationships: formattedRelations,
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
