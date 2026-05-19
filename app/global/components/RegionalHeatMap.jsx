"use client";

export default function RegionalHeatMap({ regions = {} }) {
  const sorted = Object.entries(regions).sort(([,a], [,b]) => b - a);
  
  if (sorted.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#6B7280", fontSize: "12px" }}>
        Loading regional data...
      </div>
    );
  }

  const getColor = (heat) => {
    const v = parseFloat(heat);
    if (v >= 8) return { bg: "rgba(239, 68, 68, 0.15)", border: "#EF4444", text: "#EF4444" };
    if (v >= 6) return { bg: "rgba(245, 158, 11, 0.15)", border: "#F59E0B", text: "#F59E0B" };
    if (v >= 4) return { bg: "rgba(251, 191, 36, 0.15)", border: "#FBBF24", text: "#FBBF24" };
    if (v >= 2) return { bg: "rgba(96, 165, 250, 0.15)", border: "#60A5FA", text: "#60A5FA" };
    return { bg: "rgba(74, 222, 128, 0.15)", border: "#4ADE80", text: "#4ADE80" };
  };
  
  const getLevel = (heat) => {
    const v = parseFloat(heat);
    if (v >= 8) return "CRITICAL";
    if (v >= 6) return "HIGH";
    if (v >= 4) return "ELEVATED";
    if (v >= 2) return "MODERATE";
    return "STABLE";
  };

  return (
    <div>
      <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "#6B7280", marginBottom: "12px", textTransform: "uppercase", fontWeight: "600" }}>
        🌍 Regional Heat Map
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
        {sorted.map(([region, heat]) => {
          const c = getColor(heat);
          return (
            <div key={region} style={{
              padding: "14px",
              backgroundColor: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: "8px",
              transition: "all 0.2s",
              cursor: "default",
            }}>
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "6px", fontWeight: "600" }}>
                {region}
              </div>
              <div style={{ fontSize: "22px", color: c.text, fontWeight: "800", lineHeight: 1 }}>
                {parseFloat(heat).toFixed(1)}
              </div>
              <div style={{ fontSize: "9px", color: c.text, marginTop: "4px", letterSpacing: "1px", fontWeight: "700" }}>
                ● {getLevel(heat)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
