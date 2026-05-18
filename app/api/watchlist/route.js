// ============================================
// /api/watchlist
// GET    — fetch all watchlists + items for device
// POST   — create new watchlist
// PUT    — add/remove item from watchlist
// DELETE — delete watchlist
// ============================================

import { NextResponse } from "next/server";
import supabase from "../../../database/client.js";

export const dynamic = "force-dynamic";

// Helper: ensure device exists in DB
async function ensureDevice(deviceId, userAgent) {
  if (!deviceId) return false;
  
  await supabase
    .from("wae_watchlist_devices")
    .upsert({
      device_id: deviceId,
      user_agent: userAgent || null,
      last_seen: new Date().toISOString(),
    }, { onConflict: "device_id" });
  
  return true;
}

// Helper: ensure default watchlist exists
async function ensureDefaultWatchlist(deviceId) {
  const { data: existing } = await supabase
    .from("wae_watchlists")
    .select("id")
    .eq("device_id", deviceId)
    .eq("is_default", true)
    .maybeSingle();
  
  if (existing) return existing.id;
  
  const { data: created } = await supabase
    .from("wae_watchlists")
    .insert({
      device_id: deviceId,
      name: "My Watchlist",
      icon: "⭐",
      color: "#3B82F6",
      is_default: true,
    })
    .select("id")
    .single();
  
  return created?.id;
}

// GET — fetch all watchlists + items + live prices
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("device_id");
  
  if (!deviceId) {
    return NextResponse.json({ success: false, error: "device_id required" }, { status: 400 });
  }
  
  try {
    await ensureDevice(deviceId, request.headers.get("user-agent"));
    await ensureDefaultWatchlist(deviceId);
    
    // Get all watchlists for this device
    const { data: watchlists } = await supabase
      .from("wae_watchlists")
      .select(`
        id, name, description, color, icon, is_default, sort_order, created_at,
        items:wae_watchlist_items (
          id, ticker, notes, alert_heat_threshold, alert_enabled, sort_order, added_at,
          company:wae_companies (
            id, ticker, name, sector, industry, country, market_cap_usd, ceo
          )
        )
      `)
      .eq("device_id", deviceId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    
    // For each item, get latest price
    const allTickers = (watchlists || [])
      .flatMap(w => (w.items || []).map(i => i.ticker))
      .filter(Boolean);
    
    let pricesByTicker = {};
    if (allTickers.length > 0) {
      const { data: prices } = await supabase
        .from("wae_company_prices")
        .select("ticker, price, currency, change_amount, change_percent, fetched_at")
        .in("ticker", allTickers)
        .order("fetched_at", { ascending: false });
      
      // Take latest per ticker
      (prices || []).forEach(p => {
        if (!pricesByTicker[p.ticker]) {
          pricesByTicker[p.ticker] = p;
        }
      });
    }
    
    // For each item, count active high-heat events
    let eventsByTicker = {};
    if (allTickers.length > 0) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: links } = await supabase
        .from("wae_event_company_links")
        .select(`
          ticker:wae_companies!inner(ticker),
          impact_score,
          wae_events!inner (id, heat_score, ingested_at)
        `)
        .gte("impact_score", 7)
        .gte("wae_events.ingested_at", oneDayAgo);
      
      (links || []).forEach(l => {
        const t = l.ticker?.ticker;
        if (t) {
          if (!eventsByTicker[t]) eventsByTicker[t] = 0;
          eventsByTicker[t]++;
        }
      });
    }
    
    // Enrich watchlist items
    const enriched = (watchlists || []).map(w => ({
      ...w,
      items: (w.items || []).map(item => ({
        ...item,
        price: pricesByTicker[item.ticker] || null,
        active_events: eventsByTicker[item.ticker] || 0,
      })),
      item_count: (w.items || []).length,
    }));
    
    return NextResponse.json({
      success: true,
      data: { watchlists: enriched },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// POST — create new watchlist OR add item
export async function POST(request) {
  try {
    const body = await request.json();
    const { device_id, action } = body;
    
    if (!device_id) {
      return NextResponse.json({ success: false, error: "device_id required" }, { status: 400 });
    }
    
    await ensureDevice(device_id, request.headers.get("user-agent"));
    
    // ACTION: Create new watchlist
    if (action === "create_watchlist") {
      const { name, description, color, icon } = body;
      
      const { data, error } = await supabase
        .from("wae_watchlists")
        .insert({
          device_id,
          name: name || "New Watchlist",
          description: description || null,
          color: color || "#3B82F6",
          icon: icon || "📊",
        })
        .select()
        .single();
      
      if (error) throw error;
      return NextResponse.json({ success: true, data: { watchlist: data } });
    }
    
    // ACTION: Add company to watchlist
    if (action === "add_item") {
      const { ticker, watchlist_id, notes, alert_heat_threshold } = body;
      
      if (!ticker) {
        return NextResponse.json({ success: false, error: "ticker required" }, { status: 400 });
      }
      
      // Look up company
      const { data: company } = await supabase
        .from("wae_companies")
        .select("id, ticker")
        .eq("ticker", ticker.toUpperCase())
        .single();
      
      if (!company) {
        return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
      }
      
      // Find target watchlist (default if not specified)
      let targetWatchlistId = watchlist_id;
      if (!targetWatchlistId) {
        targetWatchlistId = await ensureDefaultWatchlist(device_id);
      }
      
      // Insert item
      const { data, error } = await supabase
        .from("wae_watchlist_items")
        .upsert({
          watchlist_id: targetWatchlistId,
          company_id: company.id,
          ticker: company.ticker,
          notes: notes || null,
          alert_heat_threshold: alert_heat_threshold || 8.0,
        }, { onConflict: "watchlist_id,company_id" })
        .select()
        .single();
      
      if (error) throw error;
      return NextResponse.json({ success: true, data: { item: data } });
    }
    
    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// DELETE — remove item or watchlist
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { device_id, action, ticker, watchlist_id } = body;
    
    if (!device_id) {
      return NextResponse.json({ success: false, error: "device_id required" }, { status: 400 });
    }
    
    if (action === "remove_item") {
      if (!ticker) {
        return NextResponse.json({ success: false, error: "ticker required" }, { status: 400 });
      }
      
      // If watchlist_id provided, only remove from that one
      // Otherwise, remove from all watchlists for this device
      let query = supabase.from("wae_watchlist_items").delete();
      
      if (watchlist_id) {
        query = query.eq("watchlist_id", watchlist_id).eq("ticker", ticker.toUpperCase());
      } else {
        // Get all watchlist IDs for this device
        const { data: lists } = await supabase
          .from("wae_watchlists")
          .select("id")
          .eq("device_id", device_id);
        
        const listIds = (lists || []).map(l => l.id);
        if (listIds.length === 0) {
          return NextResponse.json({ success: true });
        }
        
        query = query.in("watchlist_id", listIds).eq("ticker", ticker.toUpperCase());
      }
      
      const { error } = await query;
      if (error) throw error;
      
      return NextResponse.json({ success: true });
    }
    
    if (action === "delete_watchlist") {
      if (!watchlist_id) {
        return NextResponse.json({ success: false, error: "watchlist_id required" }, { status: 400 });
      }
      
      // Don't delete default
      const { data: wl } = await supabase
        .from("wae_watchlists")
        .select("is_default")
        .eq("id", watchlist_id)
        .single();
      
      if (wl?.is_default) {
        return NextResponse.json({ success: false, error: "Cannot delete default watchlist" }, { status: 400 });
      }
      
      const { error } = await supabase
        .from("wae_watchlists")
        .delete()
        .eq("id", watchlist_id)
        .eq("device_id", device_id);
      
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
