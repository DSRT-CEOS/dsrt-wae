"use client";

import { useRouter } from "next/navigation";

export default function TopCompanies({ companies = [] }) {
  const router = useRouter();
  
  if (companies.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#6B7280", fontSize: "12px" }}>
        Loading top affected companies...
      </div>
    );
  }
  
  const getColor = (impact) => {
    if (impact >= 8) return "#EF4444";
    if (impact >= 6) return "#F59E0B";
    if (impact >= 4) return "#FBBF24";
    return "#60A5FA";
  };

  return (
    <div>
      <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "#6B7280", marginBottom: "12px", textTransform: "uppercase", fontWeight: "600" }}>
        🎯 Most Affected Companies (24h)
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {companies.slice(0, 6).map((c) => {
          const color = getColor(c.avg_impact);
          return (
            <div
              key={c.ticker}
              onClick={() => router.push(`/company/${c.ticker}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                backgroundColor: "#0F1623",
                border: "1px solid #1F2937",
                borderLeft: `3px solid ${color}`,
                borderRadius: "0 6px 6px 0",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#1a2538";
                e.currentTarget.style.transform = "translateX(2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#0F1623";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div style={{ minWidth: "32px", textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "800", color, lineHeight: 1 }}>
                  {c.avg_impact}
                </div>
                <div style={{ fontSize: "8px", color: "#6B7280", marginTop: "2px" }}>
                  IMPACT
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "baseline", marginBottom: "2px" }}>
                  <span style={{ fontSize: "13px", color: "#FFFFFF", fontWeight: "700" }}>{c.ticker}</span>
                  <span style={{ fontSize: "11px", color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </span>
                </div>
                <div style={{ fontSize: "10px", color: "#6B7280" }}>
                  {c.sector} · {c.country} · {c.event_count} events
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "#6B7280" }}>→</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
