// ============================================
// DSRT WAE — DATABASE QUERIES
// All database operations live here
// Keeps engine/API code clean
// ============================================

import supabase from "./client.js";
import logger from "../core/logger.js";

const MOD = "DATABASE";

// ─────────────────────────────────────────────
// EVENT OPERATIONS
// ─────────────────────────────────────────────

// Insert events with deduplication via content_hash
export async function insertEvents(events) {
  if (!events || events.length === 0) {
    logger.warn(MOD, "insertEvents called with no events");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("wae_events")
      .upsert(events, {
        onConflict: "content_hash",
        ignoreDuplicates: true,
      })
      .select();

    if (error) throw error;

    logger.info(MOD, `Inserted ${data?.length || 0} new events`);
    return data || [];
  } catch (err) {
    logger.error(MOD, "insertEvents failed", err.message);
    return [];
  }
}

// Get latest events with optional category filter
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

// Get only HOT events (heat >= threshold)
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

// Get events from a specific region
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

// Create new cycle when engine starts
export async function createCycle(cycleId) {
  try {
    const { data, error } = await supabase
      .from("wae_cycles")
      .insert({
        id: cycleId,
        status: "running",
      })
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

// Mark cycle complete with final stats
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

// Get most recent cycle (for dashboard "Last Updated")
export async function getLatestCycle() {
  try {
    const { data, error } = await supabase
      .from("wae_cycles")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No cycles yet is not an error
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  } catch (err) {
    logger.error(MOD, "getLatestCycle failed", err.message);
    return null;
  }
}

// Get history of last N cycles
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
// STATISTICS / AGGREGATIONS
// ─────────────────────────────────────────────

// Get system-wide statistics
export async function getStats() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();

    // Total events ever
    const { count: totalEvents } = await supabase
      .from("wae_events")
      .select("*", { count: "exact", head: true });

    // Events in last 24h
    const { count: last24h } = await supabase
      .from("wae_events")
      .select("*", { count: "exact", head: true })
      .gte("ingested_at", oneDayAgo);

    // Events in last hour
    const { count: lastHour } = await supabase
      .from("wae_events")
      .select("*", { count: "exact", head: true })
      .gte("ingested_at", oneHourAgo);

    // Average heat in last 24h
    const { data: heatData } = await supabase
      .from("wae_events")
      .select("heat_score")
      .gte("ingested_at", oneDayAgo);

    const avgHeat = heatData?.length
      ? (heatData.reduce((a, b) => a + parseFloat(b.heat_score), 0) / heatData.length).toFixed(1)
      : 0;

    // Hot events count (heat >= 7) in last 24h
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

// Get category distribution (for stats)
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
