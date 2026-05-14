"use client";

// ============================================
// DSRT WAE — Global Stats Component
// 4 key metrics: Heat, Events, Last Cycle, Status
// ============================================

export default function GlobalStats({ stats, cycle }) {
  const getHeatColor = (score) => {
    if (score >= 8) return "#FF0000";
    if (score >= 6) return "#FF6600";
    if (score >= 4) return "#FFCC00";
    if (score >= 2) return "#0066FF";
    return "#00CC00";
  };

  const getHeatLabel = (score) => {
    if (score >= 8) return "🔴 CRITICAL";
    if (score >= 6) return "🟠 ELEVATED";
    if (score >= 4) return "🟡 MODERATE";
    if (score >= 2) return "🔵 LOW";
    return "🟢 STABLE";
  };

  const minutesAgo = (date) => {
    if (!date) return "—";
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const globalHeat = cycle?.global_heat_score || stats?.avgHeatScore || 0;

  const statBoxStyle = {
    backgroundColor: "#0F172A",
    border: "1px solid #1E293B",
    borderRadius: "8px",
    padding: "16px",
    textAlign: "center",
  };

  const labelStyle = {
    fontSize: "10px",
    letterSpacing: "2px",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: "8px",
  };

  const valueStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    margin: "4px 0",
  };

  const subStyle = {
    fontSize: "10px",
    color: "#475569",
    marginTop: "4px",
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginBottom: "24px",
    }}>
      {/* Global Threat Level */}
      <div style={statBoxStyle}>
        <div style={labelStyle}>Global Threat Level</div>
        <div style={{ ...valueStyle, color: getHeatColor(globalHeat) }}>
          {globalHeat || "—"}
        </div>
        <div style={{ fontSize: "11px", marginTop: "4px" }}>
          {getHeatLabel(globalHeat)}
        </div>
      </div>

      {/* Events 24h */}
      <div style={statBoxStyle}>
        <div style={labelStyle}>Events Tracked (24h)</div>
        <div style={{ ...valueStyle, color: "#3B82F6" }}>
          {stats?.eventsLast24h || 0}
        </div>
        <div style={subStyle}>
          {stats?.totalEvents || 0} all-time
        </div>
      </div>

      {/* Hot Events */}
      <div style={statBoxStyle}>
        <div style={labelStyle}>Critical Events (24h)</div>
        <div style={{ ...valueStyle, color: "#FF6600" }}>
          {stats?.hotEventsCount || 0}
        </div>
        <div style={subStyle}>
          Heat ≥ 7
        </div>
      </div>

      {/* Last Cycle */}
      <div style={statBoxStyle}>
        <div style={labelStyle}>System Status</div>
        <div style={{ ...valueStyle, color: "#4ADE80", fontSize: "16px", marginTop: "8px" }}>
          ● OPERATIONAL
        </div>
        <div style={subStyle}>
          Last cycle: {minutesAgo(cycle?.started_at)}
        </div>
      </div>
    </div>
  );
}
