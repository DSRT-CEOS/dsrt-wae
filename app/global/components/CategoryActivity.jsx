"use client";

export default function CategoryActivity({ data = {} }) {
  const entries = Object.entries(data)
    .map(([cat, stats]) => ({
      category: cat,
      count: stats.count || 0,
      avg_heat: stats.avg_heat || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  
  if (entries.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#6B7280", fontSize: "12px" }}>
        Loading category activity...
      </div>
    );
  }
  
  const max = Math.max(...entries.map(e => e.count));
  
  const colors = {
    geopolitics: "#C084FC",
    economy: "#60A5FA",
    tech: "#4ADE80",
    energy: "#FB923C",
    defense: "#F87171",
    markets: "#2DD4BF",
    climate: "#34D399",
    technology: "#4ADE80",
    hot_conflict: "#EF4444",
    military: "#F87171",
    diplomacy: "#818CF8",
    social: "#FBBF24",
    health: "#67E8F9",
    general: "#9CA3AF",
  };

  return (
    <div>
      <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "#6B7280", marginBottom: "12px", textTransform: "uppercase", fontWeight: "600" }}>
        📊 Category Activity (24h)
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {entries.map((e, i) => {
          const widthPct = (e.count / max) * 100;
          const color = colors[e.category] || "#9CA3AF";
          
          return (
            <div key={e.category}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11px" }}>
                <span style={{ color: "#D1D5DB", fontWeight: "500", textTransform: "capitalize" }}>
                  {e.category.replace(/_/g, " ")}
                </span>
                <span style={{ color: "#9CA3AF" }}>
                  <span style={{ color, fontWeight: "700" }}>{e.count}</span>
                  <span style={{ marginLeft: "8px", fontSize: "10px" }}>
                    avg {e.avg_heat}
                  </span>
                </span>
              </div>
              <div style={{ 
                height: "6px", 
                backgroundColor: "#1F2937", 
                borderRadius: "3px",
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${widthPct}%`,
                  height: "100%",
                  backgroundColor: color,
                  borderRadius: "3px",
                  transition: "width 0.6s ease-out",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
