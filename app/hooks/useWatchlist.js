// ============================================
// useWatchlist hook
// Manages anonymous device-based watchlists
// ============================================

"use client";

import { useState, useEffect, useCallback } from "react";

// Generate stable device ID and store in localStorage
function getDeviceId() {
  if (typeof window === "undefined") return null;
  
  let id = localStorage.getItem("dsrt_device_id");
  if (!id) {
    id = "dev_" + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
    localStorage.setItem("dsrt_device_id", id);
  }
  return id;
}

export function useWatchlist() {
  const [watchlists, setWatchlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
  }, []);

  const fetchWatchlists = useCallback(async () => {
    if (!deviceId) return;
    
    try {
      setError(null);
      const res = await fetch(`/api/watchlist?device_id=${deviceId}`);
      const json = await res.json();
      if (json.success) {
        setWatchlists(json.data.watchlists || []);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (deviceId) {
      fetchWatchlists();
      // Refresh every 60 seconds
      const interval = setInterval(fetchWatchlists, 60000);
      return () => clearInterval(interval);
    }
  }, [deviceId, fetchWatchlists]);

  // Check if a ticker is in any watchlist
  const isWatched = useCallback((ticker) => {
    if (!ticker) return false;
    return watchlists.some(w => 
      (w.items || []).some(i => i.ticker?.toUpperCase() === ticker.toUpperCase())
    );
  }, [watchlists]);

  // Add to default watchlist
  const addToWatchlist = useCallback(async (ticker, watchlistId = null) => {
    if (!deviceId || !ticker) return false;
    
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceId,
          action: "add_item",
          ticker,
          watchlist_id: watchlistId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchWatchlists();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Add to watchlist error:", err);
      return false;
    }
  }, [deviceId, fetchWatchlists]);

  // Remove from all watchlists (or specific one)
  const removeFromWatchlist = useCallback(async (ticker, watchlistId = null) => {
    if (!deviceId || !ticker) return false;
    
    try {
      const res = await fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceId,
          action: "remove_item",
          ticker,
          watchlist_id: watchlistId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchWatchlists();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Remove from watchlist error:", err);
      return false;
    }
  }, [deviceId, fetchWatchlists]);

  // Toggle (add if not present, remove if present)
  const toggleWatchlist = useCallback(async (ticker) => {
    if (isWatched(ticker)) {
      return await removeFromWatchlist(ticker);
    } else {
      return await addToWatchlist(ticker);
    }
  }, [isWatched, addToWatchlist, removeFromWatchlist]);

  // Create new watchlist
  const createWatchlist = useCallback(async (name, options = {}) => {
    if (!deviceId) return null;
    
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceId,
          action: "create_watchlist",
          name,
          description: options.description,
          color: options.color,
          icon: options.icon,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchWatchlists();
        return json.data.watchlist;
      }
      return null;
    } catch (err) {
      console.error("Create watchlist error:", err);
      return null;
    }
  }, [deviceId, fetchWatchlists]);

  // Delete watchlist
  const deleteWatchlist = useCallback(async (watchlistId) => {
    if (!deviceId || !watchlistId) return false;
    
    try {
      const res = await fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceId,
          action: "delete_watchlist",
          watchlist_id: watchlistId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchWatchlists();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Delete watchlist error:", err);
      return false;
    }
  }, [deviceId, fetchWatchlists]);

  // Totals
  const totalCompanies = watchlists.reduce(
    (sum, w) => sum + ((w.items || []).length), 
    0
  );
  
  const totalAlerts = watchlists.reduce(
    (sum, w) => sum + ((w.items || []).reduce((s, i) => s + (i.active_events || 0), 0)),
    0
  );

  return {
    watchlists,
    loading,
    error,
    deviceId,
    isWatched,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    createWatchlist,
    deleteWatchlist,
    refresh: fetchWatchlists,
    totalCompanies,
    totalAlerts,
  };
}
