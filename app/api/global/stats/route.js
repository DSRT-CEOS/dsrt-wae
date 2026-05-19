// /api/global/stats — Enhanced with recent events for world map
import { NextResponse } from "next/server";
import supabase from "../../../../database/client.js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // 1. Latest brief
    const { data: latestBrief } = await supabase
      .from("dsrt_daily_briefs")
      .select("global_heat_index, threat_level, regional_heat, heat_change")
      .order("brief_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // 2. 7-day trend
    const { data: heatTrend } = await supabase
      .from("dsrt_daily_briefs")
      .select("brief_date, global_heat_index, threat_level")
      .gte("brief_date", sevenDaysAgo.split("T")[0])
      .order("brief_date", { ascending: true });
    
    // 3. Category activity
    const { data: events24h } = await supabase
      .from("wae_events")
      .select("category, heat_score, region")
      .gte("ingested_at", oneDayAgo);
    
    const categoryStats = {};
    (events24h || []).forEach(e => {
      const cat = e.category || "general";
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, total_heat: 0 };
      }
      categoryStats[cat].count++;
      categoryStats[cat].total_heat += parseFloat(e.heat_score) || 0;
    });
    Object.keys(categoryStats).forEach(cat => {
      categoryStats[cat].avg_heat = parseFloat((categoryStats[cat].total_heat / categoryStats[cat].count).toFixed(1));
    });
    
    // 4. Recent high-heat events with countries (for world map)
    const { data: recentEventsForMap } = await supabase
      .from("wae_events")
      .select("id, title, heat_score, category, region, countries, published_at")
      .gte("ingested_at", oneDayAgo)
      .gte("heat_score", 4)
      .not("countries", "is", null)
      .order("heat_score", { ascending: false })
      .limit(80);
    
    // Also get slugs for related articles per event
    const eventIds = (recentEventsForMap || []).map(e => e.id);
    let articleByEvent = {};
    if (eventIds.length > 0) {
      const { data: articles } = await supabase
        .from("dsrt_articles")
        .select("slug, triggering_event_id, title")
        .in("triggering_event_id", eventIds)
        .eq("status", "published");
      
      (articles || []).forEach(a => {
        if (a.triggering_event_id) {
          articleByEvent[a.triggering_event_id] = a.slug;
        }
      });
    }
    
    const mapEvents = (recentEventsForMap || []).map(e => ({
      ...e,
      slug: articleByEvent[e.id] || null,
    }));
    
    // 5. Top affected companies
    const { data: linkData } = await supabase
      .from("wae_event_company_links")
      .select(`
        impact_score,
        wae_companies!inner (ticker, name, sector, country),
        wae_events!inner (ingested_at)
      `)
      .gte("impact_score", 7)
      .gte("wae_events.ingested_at", oneDayAgo);
    
    const companyImpacts = {};
    (linkData || []).forEach(l => {
      const ticker = l.wae_companies?.ticker;
      if (!ticker) return;
      if (!companyImpacts[ticker]) {
        companyImpacts[ticker] = {
          ticker,
          name: l.wae_companies.name,
          sector: l.wae_companies.sector,
          country: l.wae_companies.country,
          event_count: 0,
          total_impact: 0,
        };
      }
      companyImpacts[ticker].event_count++;
      companyImpacts[ticker].total_impact += parseFloat(l.impact_score) || 0;
    });
    
    const topCompanies = Object.values(companyImpacts)
      .map(c => ({ ...c, avg_impact: parseFloat((c.total_impact / c.event_count).toFixed(1)) }))
      .sort((a, b) => b.total_impact - a.total_impact)
      .slice(0, 10);
    
    // 6. Article stats
    const { data: articles24h } = await supabase
      .from("dsrt_articles")
      .select("article_type, category, published_at")
      .eq("status", "published")
      .gte("published_at", oneDayAgo);
    
    const articleStats = {
      total_24h: (articles24h || []).length,
      by_type: {},
      by_category: {},
    };
    (articles24h || []).forEach(a => {
      const type = a.article_type || "analysis";
      const cat = a.category || "general";
      articleStats.by_type[type] = (articleStats.by_type[type] || 0) + 1;
      articleStats.by_category[cat] = (articleStats.by_category[cat] || 0) + 1;
    });
    
    // 7. Regional activity
    const regionStats = {};
    (events24h || []).forEach(e => {
      const r = e.region || "Global";
      if (!regionStats[r]) regionStats[r] = { count: 0, total_heat: 0 };
      regionStats[r].count++;
      regionStats[r].total_heat += parseFloat(e.heat_score) || 0;
    });
    const regionalActivity = Object.entries(regionStats).map(([region, s]) => ({
      region,
      event_count: s.count,
      avg_heat: parseFloat((s.total_heat / s.count).toFixed(1)),
    })).sort((a, b) => b.event_count - a.event_count);
    
    return NextResponse.json({
      success: true,
      data: {
        current_heat: {
          index: latestBrief?.global_heat_index || 0,
          threat_level: latestBrief?.threat_level || "STABLE",
          change: latestBrief?.heat_change || 0,
        },
        heat_trend_7d: heatTrend || [],
        regional_heat: latestBrief?.regional_heat || {},
        category_activity: categoryStats,
        top_affected_companies: topCompanies,
        article_stats: articleStats,
        regional_activity: regionalActivity,
        map_events: mapEvents,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
