// ============================================
// DSRT WAE — DATABASE QUERIES (V2 — Fixed)
// ============================================

import supabase from "./client.js";
import logger from "../core/logger.js";

const MOD = "DATABASE";

// ─────────────────────────────────────────────
// EVENT OPERATIONS
// ─────────────────────────────────────────────

export async function insertEvents(events) {
  if (!events || events.length === 0) {
    logger.warn(MOD, "insertEvents called with no events");
    return [];
  }

  try {
    // Strip fields not in DB schema
    const cleanEvents = events.map(e => ({
      title: e.title,
      summary: e.summary || null,
      content: e.content || null,
      url: e.url || null,
      image_url: e.image_url || null,
      category: e.category || "general",
      region: e.region || "Global",
      heat_score: e.heat_score || 5.0,
      source_module: e.source_module,
      source_name: e.source_name || null,
      source_url: e.source_url || null,
      content_hash: e.content_hash,
      countries: e.countries || [],
      entities: e.entities || [],
      keywords: e.keywords || [],
      published_at: e.published_at || null,
      processed_at: e.processed_at || null,
      status: e.status || "raw",
      cycle_id: e.cycle_id || null,
    }));

    // Use upsert WITHOUT ignoreDuplicates so it returns data
    const { data, error } = await supabase
      .from("wae_events")
      .upsert(cleanEvents, {
        onConflict: "content_hash",
        ignoreDuplicates: false, // ← critical change
      })
      .select();

    if (error) {
      logger.error(MOD, "insertEvents error", error);
      return [];
    }

    logger.info(MOD, `Upserted ${data?.length || 0} events`);
    return data || [];
  } catch (err) {
    logger.error(MOD, "insertEvents exception", err.message);
    return [];
  }
}

export async function getLatestEvents(limit = 50, category = null) {
  try {
    let query = supabase
      .from("wae_events")
      .select("*")
      .order("ingested_at", { ascending: false })
      .limit(limit);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    logger.error(MOD, "getLatestEvents failed", err.message);
    return [];
  }
}

export async function getHotEvents(minHeat = 7, limit = 20) {
  try {
    const { data, error } = await supabase
      .from("wae_events")
      .select("*")
      .gte("heat_score", minHeat)
      .order("heat_score", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    logger.error(MOD, "getHotEvents failed", err.message);
    return [];
  }
}

export async function getEventsByRegion(region, limit = 30) {
  try {
    const { data, error } = await supabase
      .from("wae_events")
      .select("*")
      .eq("region", region)
      .order("heat_score", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    logger.error(MOD, "getEventsByRegion failed", err.message);
    return [];
  }
}

// ─────────────────────────────────────────────
// CYCLE OPERATIONS
// ─────────────────────────────────────────────

export async function createCycle(cycleId) {
  try {
    const { data, error } = await supabase
      .from("wae_cycles")
      .insert({ id: cycleId, status: "running" })
      .select()
      .single();
    if (error) throw error;
    logger.info(MOD, `Created cycle: ${cycleId}`);
    return data;
  } catch (err) {
    logger.error(MOD, "createCycle failed", err.message);
    return null;
  }
}

export async function completeCycle(cycleId, stats) {
  try {
    const { data, error } = await supabase
      .from("wae_cycles")
      .update({
        completed_at: new Date().toISOString(),
        status: "completed",
        ...stats,
      })
      .eq("id", cycleId)
      .select()
      .single();
    if (error) throw error;
    logger.info(MOD, `Completed cycle: ${cycleId}`);
    return data;
  } catch (err) {
    logger.error(MOD, "completeCycle failed", err.message);
    return null;
  }
}

export async function getLatestCycle() {
  try {
    const { data, error } = await supabase
      .from("wae_cycles")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  } catch (err) {
    logger.error(MOD, "getLatestCycle failed", err.message);
    return null;
  }
}

export async function getCycleHistory(limit = 10) {
  try {
    const { data, error } = await supabase
      .from("wae_cycles")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    logger.error(MOD, "getCycleHistory failed", err.message);
    return [];
  }
}

// ─────────────────────────────────────────────
// STATISTICS
// ─────────────────────────────────────────────

export async function getStats() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();

    const { count: totalEvents } = await supabase
      .from("wae_events")
      .select("*", { count: "exact", head: true });

    const { count: last24h } = await supabase
      .from("wae_events")
      .select("*", { count: "exact", head: true })
      .gte("ingested_at", oneDayAgo);

    const { count: lastHour } = await supabase
      .from("wae_events")
      .select("*", { count: "exact", head: true })
      .gte("ingested_at", oneHourAgo);

    const { data: heatData } = await supabase
      .from("wae_events")
      .select("heat_score")
      .gte("ingested_at", oneDayAgo);

    const avgHeat = heatData?.length
      ? (heatData.reduce((a, b) => a + parseFloat(b.heat_score), 0) / heatData.length).toFixed(1)
      : 0;

    const { count: hotCount } = await supabase
      .from("wae_events")
      .select("*", { count: "exact", head: true })
      .gte("heat_score", 7)
      .gte("ingested_at", oneDayAgo);

    return {
      totalEvents: totalEvents || 0,
      eventsLast24h: last24h || 0,
      eventsLastHour: lastHour || 0,
      avgHeatScore: parseFloat(avgHeat),
      hotEventsCount: hotCount || 0,
    };
  } catch (err) {
    logger.error(MOD, "getStats failed", err.message);
    return {
      totalEvents: 0,
      eventsLast24h: 0,
      eventsLastHour: 0,
      avgHeatScore: 0,
      hotEventsCount: 0,
    };
  }
}

export async function getCategoryBreakdown() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("wae_events")
      .select("category")
      .gte("ingested_at", oneDayAgo);
    if (error) throw error;
    const breakdown = {};
    (data || []).forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + 1;
    });
    return breakdown;
  } catch (err) {
    logger.error(MOD, "getCategoryBreakdown failed", err.message);
    return {};
  }
}
