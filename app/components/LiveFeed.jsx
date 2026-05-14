"use client";

// ============================================
// DSRT WAE — Live Feed Component
// Filterable, sortable list of world events
// ============================================

import { useState, useMemo } from "react";
import EventCard from "./EventCard";

const CATEGORIES = [
  { id: "all", label: "ALL", icon: "🌍" },
  { id: "hot_conflict", label: "CONFLICT", icon: "🔴" },
  { id: "military", label: "MILITARY", icon: "⚔️" },
  { id: "geopolitics", label: "GEOPOLITICS", icon: "🌐" },
  { id: "economy", label: "ECONOMY", icon: "📊" },
  { id: "energy", label: "ENERGY", icon: "⚡" },
  { id: "technology", label: "TECH", icon: "💻" },
  { id: "diplomacy", label: "DIPLOMACY", icon: "🤝" },
  { id: "social", label: "SOCIAL", icon: "✊" },
  { id: "climate", label: "CLIMATE", icon: "🌡️" },
  { id: "health", label: "HEALTH", icon: "🏥" },
];

export default function LiveFeed({ events }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("heat");
  const [activeRegion, setActiveRegion] = useState("all");

  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const counts = { all: events?.length || 0 };
    events?.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return counts;
  }, [events]);

  // Get unique regions
  const regions = useMemo(() => {
    const set = new Set(events?.map((e) => e.region).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [events]);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = events || [];

    if (activeCategory !== "all") {
      result = result.filter((e) => e.category === activeCategory);
    }

    if (activeRegion !== "all") {
      result = result.filter((e) => e.region === activeRegion);
    }

    if (sortBy === "heat") {
      result = [...result].sort((a, b) => (b.heat_score || 0) - (a.heat_score || 0));
    } else {
      result = [...result].sort(
        (a, b) => new Date(b.ingested_at) - new Date(a.ingested_at)
      );
    }

    return result;
  }, [events, activeCategory, activeRegion, sortBy]);

  return (
    <div style={{
      backgroundColor: "rgba(15, 23, 42, 0.5)",
      border: "1px solid #1E293B",
      borderRadius: "8px",
      padding: "16px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "1px solid #1E293B",
      }}>
        <h2 style={{
          fontSize: "12px",
          letterSpacing: "3px",
          color: "#94A3B8",
          textTransform: "uppercase",
          margin: 0,
        }}>
          📡 Live Intelligence Feed
        </h2>
        <span style={{ fontSize: "11px", color: "#64748B" }}>
          Auto-refresh every 60s
        </span>
      </div>

      {/* Category Filter */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        marginBottom: "12px",
      }}>
        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id] || 0;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: "5px 10px",
                fontSize: "10px",
                letterSpacing: "1px",
                borderRadius: "4px",
                border: `1px solid ${isActive ? "#3B82F6" : "#334155"}`,
                backgroundColor: isActive ? "rgba(59, 130, 246, 0.2)" : "#0F172A",
                color: isActive ? "#60A5FA" : "#94A3B8",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: isActive ? "bold" : "normal",
                opacity: count === 0 && !isActive ? 0.4 : 1,
              }}
            >
              {cat.icon} {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Region Filter + Sort */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "11px" }}>
          <span style={{ color: "#64748B" }}>Region:</span>
          <select
            value={activeRegion}
            onChange={(e) => setActiveRegion(e.target.value)}
            style={{
              padding: "4px 8px",
              backgroundColor: "#0F172A",
              border: "1px solid #334155",
              borderRadius: "4px",
              color: "#E2E8F0",
              fontSize: "11px",
              fontFamily: "inherit",
            }}
          >
            {regions.map((r) => (
              <option key={r} value={r}>
                {r === "all" ? "All Regions" : r}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "11px" }}>
          <span style={{ color: "#64748B" }}>Sort:</span>
          <button
            onClick={() => setSortBy("heat")}
            style={{
              padding: "4px 10px",
              backgroundColor: sortBy === "heat" ? "rgba(255, 102, 0, 0.2)" : "#0F172A",
              border: `1px solid ${sortBy === "heat" ? "#FF6600" : "#334155"}`,
              borderRadius: "4px",
              color: sortBy === "heat" ? "#FF8C42" : "#94A3B8",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "inherit",
            }}
          >
            🔥 By Heat
          </button>
          <button
            onClick={() => setSortBy("time")}
            style={{
              padding: "4px 10px",
              backgroundColor: sortBy === "time" ? "rgba(59, 130, 246, 0.2)" : "#0F172A",
              border: `1px solid ${sortBy === "time" ? "#3B82F6" : "#334155"}`,
              borderRadius: "4px",
              color: sortBy === "time" ? "#60A5FA" : "#94A3B8",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "inherit",
            }}
          >
            🕐 By Time
          </button>
        </div>
      </div>

      {/* Results count */}
      <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "12px" }}>
        Showing {filtered.length} events
      </div>

      {/* Events */}
      <div>
        {filtered.length > 0 ? (
          filtered.map((event, i) => (
            <EventCard key={event.id || i} event={event} />
          ))
        ) : (
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#475569",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📡</div>
            <p style={{ fontSize: "14px", marginBottom: "4px" }}>
              No events in this category yet
            </p>
            <p style={{ fontSize: "11px" }}>
              Waiting for next intelligence cycle...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
