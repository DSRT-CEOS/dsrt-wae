"use client";

import { useRouter } from "next/navigation";

export default function EventCard({ event }) {
  const router = useRouter();

  if (!event) return null;

  const getHeatStyle = (score) => {
    if (score >= 8) return { borderColor: "#FF0000", backgroundColor: "rgba(255, 0, 0, 0.05)", glowColor: "rgba(255, 0, 0, 0.3)" };
    if (score >= 6) return { borderColor: "#FF6600", backgroundColor: "rgba(255, 102, 0, 0.05)", glowColor: "rgba(255, 102, 0, 0.2)" };
    if (score >= 4) return { borderColor: "#FFCC00", backgroundColor: "rgba(255, 204, 0, 0.05)", glowColor: "rgba(255, 204, 0, 0.15)" };
    if (score >= 2) return { borderColor: "#0066FF", backgroundColor: "rgba(0, 102, 255, 0.05)", glowColor: "rgba(0, 102, 255, 0.1)" };
    return { borderColor: "#00CC00", backgroundColor: "rgba(0, 204, 0, 0.05)", glowColor: "rgba(0, 204, 0, 0.1)" };
  };

  const getHeatEmoji = (s) => s >= 8 ? "RED" : s >= 6 ? "ORG" : s >= 4 ? "YEL" : s >= 2 ? "BLU" : "GRN";

  const getCategoryBadge = (cat) => {
    const c = {
      hot_conflict: { bg: "rgba(255,0,0,0.2)", color: "#FF6B6B" },
      military: { bg: "rgba(180,0,0,0.2)", color: "#FF4444" },
      geopolitics: { bg: "rgba(255,102,0,0.2)", color: "#FF8C42" },
      economy: { bg: "rgba(0,102,255,0.2)", color: "#60A5FA" },
      energy: { bg: "rgba(0,153,0,0.2)", color: "#4ADE80" },
      technology: { bg: "rgba(153,0,204,0.2)", color: "#C084FC" },
      climate: { bg: "rgba(0,102,51,0.2)", color: "#34D399" },
      social: { bg: "rgba(255,153,0,0.2)", color: "#FCD34D" },
      health: { bg: "rgba(0,204,204,0.2)", color: "#67E8F9" },
      diplomacy: { bg: "rgba(51,102,255,0.2)", color: "#818CF8" },
      general: { bg: "rgba(100,116,139,0.2)", color: "#94A3B8" },
    };
    return c[cat] || c.general;
  };

  const timeAgo = (date) => {
    if (!date) return "unknown";
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  const heat = event.heat_score || 0;
  const heatStyle = getHeatStyle(heat);
  const catBadge = getCategoryBadge(event.category);

  const handleClick = () => {
    router.push(`/event/${event.id}`);
  };

  const handleSourceClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      style={{
        borderLeft: `4px solid ${heatStyle.borderColor}`,
        backgroundColor: heatStyle.backgroundColor,
        borderRadius: "0 8px 8px 0",
        padding: "14px 16px",
        marginBottom: "10px",
        transition: "all 0.2s",
        cursor: "pointer",
        boxShadow: heat >= 8 ? `0 0 12px ${heatStyle.glowColor}` : "none",
      }}
      onClick={handleClick}
      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.5)"; }}
      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = heatStyle.backgroundColor; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "9px",
              padding: "2px 8px",
              borderRadius: "3px",
              backgroundColor: catBadge.bg,
              color: catBadge.color,
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}>{(event.category || "general").replace(/_/g, " ")}</span>
            <span style={{ fontSize: "10px", color: "#64748B" }}>{event.region}</span>
            {event.countries && event.countries.length > 0 && (
              <span style={{ fontSize: "10px", color: "#475569" }}>
                [{event.countries.slice(0, 3).join(", ")}]
              </span>
            )}
            {event.ai_summary && (
              <span style={{
                fontSize: "9px",
                padding: "1px 6px",
                backgroundColor: "rgba(74, 222, 128, 0.15)",
                color: "#4ADE80",
                borderRadius: "3px",
                border: "1px solid rgba(74, 222, 128, 0.3)",
              }}>AI ANALYZED</span>
            )}
          </div>

          <h3 style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#E2E8F0",
            lineHeight: "1.4",
            margin: 0,
            marginBottom: "4px",
          }}>{event.title}</h3>

          {event.summary && (
            <p style={{
              fontSize: "11px",
              color: "#94A3B8",
              lineHeight: "1.5",
              margin: 0,
              marginBottom: "6px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>{event.summary}</p>
          )}

          <div style={{ display: "flex", gap: "10px", fontSize: "10px", color: "#64748B", marginTop: "4px" }}>
            <span>{event.source_name}</span>
            <span>|</span>
            <span>{timeAgo(event.published_at || event.ingested_at)}</span>
            <span>|</span>
            <span style={{ color: "#3B82F6", fontWeight: "bold" }}>
              View Intelligence
            </span>
            {event.url && (
              <>
                <span>|</span>
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleSourceClick}
                  style={{ color: "#475569", textDecoration: "none" }}
                >
                  Source
                </a>
              </>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: heatStyle.borderColor,
            lineHeight: 1,
            animation: heat >= 8 ? "pulse-critical 2s ease-in-out infinite" : "none",
          }}>{heat}</div>
          <div style={{ fontSize: "8px", color: "#475569", letterSpacing: "1px", marginTop: "2px" }}>HEAT</div>
        </div>
      </div>
    </div>
  );
}
