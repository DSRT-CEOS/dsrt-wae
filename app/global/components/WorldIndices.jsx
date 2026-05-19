"use client";

import { useMemo } from "react";

// Calculate 5 specialized indices from events data
export default function WorldIndices({ events = [], categoryActivity = {} }) {
  const indices = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        conflict: { value: 0, label: "STABLE", change: 0 },
        economic: { value: 0, label: "STABLE", change: 0 },
        tech: { value: 0, label: "STABLE", change: 0 },
        climate: { value: 0, label: "STABLE", change: 0 },
        diplomatic: { value: 0, label: "STABLE", change: 0 },
      };
    }

    // CONFLICT INTENSITY: avg heat of conflict/military/defense events
    const conflictCats = ["hot_conflict", "military", "defense", "conflict"];
    const conflictEvents = events.filter(e => conflictCats.includes(e.category));
    const conflictAvg = conflictEvents.length > 0 
      ? conflictEvents.reduce((s, e) => s + (e.heat_score || 0), 0) / conflictEvents.length
      : 0;

    // ECONOMIC STRESS: avg heat of economy/markets/energy events
    const ecoCats = ["economy", "markets", "energy"];
    const ecoEvents = events.filter(e => ecoCats.includes(e.category));
    const ecoAvg = ecoEvents.length > 0 
      ? ecoEvents.reduce((s, e) => s + (e.heat_score || 0), 0) / ecoEvents.length
      : 0;

    // TECH ACTIVITY: count + heat of tech events
    const techCats = ["tech", "technology"];
    const techEvents = events.filter(e => techCats.includes(e.category));
    const techScore = techEvents.length > 0 
      ? Math.min(10, (techEvents.length / 3) + (techEvents.reduce((s, e) => s + (e.heat_score || 0), 0) / techEvents.length / 2))
      : 0;

    // CLIMATE RISK: avg heat of climate events
    const climateCats = ["climate", "environment"];
    const climateEvents = events.filter(e => climateCats.includes(e.category));
    const climateAvg = climateEvents.length > 0 
      ? climateEvents.reduce((s, e) => s + (e.heat_score || 0), 0) / climateEvents.length
      : 0;

    // DIPLOMATIC ACTIVITY: count + heat of geopolitics/diplomacy
    const diploCats = ["geopolitics", "diplomacy"];
    const diploEvents = events.filter(e => diploCats.includes(e.category));
    const diploScore = diploEvents.length > 0 
      ? diploEvents.reduce((s, e) => s + (e.heat_score || 0), 0) / diploEvents.length
      : 0;

    const labelFor = (v) => v >= 8 ? "CRITICAL" : v >= 6 ? "HIGH" : v >= 4 ? "ELEVATED" : v >= 2 ? "MODERATE" : "STABLE";

    return {
      conflict: { value: parseFloat(conflictAvg.toFixed(1)), label: labelFor(conflictAvg), count: conflictEvents.length },
      economic: { value: parseFloat(ecoAvg.toFixed(1)), label: labelFor(ecoAvg), count: ecoEvents.length },
      tech: { value: parseFloat(techScore.toFixed(1)), label: labelFor(techScore), count: techEvents.length },
      climate: { value: parseFloat(climateAvg.toFixed(1)), label: labelFor(climateAvg), count: climateEvents.length },
      diplomatic: { value: parseFloat(diploScore.toFixed(1)), label: labelFor(diploScore), count: diploEvents.length },
    };
  }, [events]);

  const items = [
    { id: "conflict", icon: "⚔️", title: "Conflict Intensity", description: "Military, defense, hot conflict events", data: indices.conflict, color: "#EF4444" },
    { id: "economic", icon: "💰", title: "Economic Stress", description: "Markets, economy, energy disruption", data: indices.economic, color: "#F59E0B" },
    { id: "diplomatic", icon: "🤝", title: "Diplomatic Activity", description: "Geopolitics, treaties, summits", data: indices.diplomatic, color: "#C084FC" },
    { id: "tech", icon: "💻", title: "Tech & Innovation", description: "AI, semiconductors, cyber events", data: indices.tech, color: "#4ADE80" },
    { id: "climate", icon: "🌱", title: "Climate Risk", description: "Disasters, environmental events", data: indices.climate, color: "#34D399" },
  ];

  const getColor = (v) => v >= 8 ? "#EF4444" : v >= 6 ? "#F59E0B" : v >= 4 ? "#FBBF24" : v >= 2 ? "#60A5FA" : "#4ADE80";

  return (
    <div>
      <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "#6B7280", marginBottom: "12px", textTransform: "uppercase", fontWeight: "600" }}>
        📊 Specialized Intelligence Indices
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
        {items.map(item => {
          const color = getColor(item.data.value);
          return (
            <div key={item.id} style={{
              padding: "14px",
              backgroundColor: "#0a0e1a",
              border: `1px solid ${color}33`,
              borderLeft: `3px solid ${color}`,
              borderRadius: "0 8px 8px 0",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ fontSize: "16px" }}>{item.icon}</span>
                <span style={{ fontSize: "10px", color: "#6B7280", letterSpacing: "1px" }}>
                  {item.data.count || 0} events
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#D1D5DB", fontWeight: "600", marginBottom: "8px", lineHeight: "1.3" }}>
                {item.title}
              </div>
              <div style={{ fontSize: "22px", color, fontWeight: "800", lineHeight: 1, marginBottom: "4px" }}>
                {item.data.value.toFixed(1)}
              </div>
              <div style={{ fontSize: "9px", color, marginTop: "4px", letterSpacing: "1px", fontWeight: "700" }}>
                ● {item.data.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
