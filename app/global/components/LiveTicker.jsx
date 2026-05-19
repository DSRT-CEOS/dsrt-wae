"use client";

import { useState, useEffect } from "react";

export default function LiveTicker() {
  const [companies, setCompanies] = useState([]);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/global/stats");
        const json = await res.json();
        if (json.success) {
          setCompanies(json.data.top_affected_companies || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  if (companies.length === 0) return null;

  return (
    <div style={{
      backgroundColor: "#000000",
      borderBottom: "1px solid #1F2937",
      overflow: "hidden",
      whiteSpace: "nowrap",
      padding: "8px 0",
      position: "relative",
    }}>
      <div style={{
        display: "inline-block",
        animation: "scroll 60s linear infinite",
        paddingLeft: "100%",
      }}>
        <span style={{ color: "#3B82F6", fontWeight: "700", fontSize: "11px", letterSpacing: "1.5px", marginRight: "24px", textTransform: "uppercase" }}>
          🔴 LIVE · TOP AFFECTED COMPANIES (24H)
        </span>
        {[...companies, ...companies].map((c, i) => (
          <span key={i} style={{ 
            marginRight: "32px", 
            fontSize: "12px",
            fontFamily: "'Courier New', monospace",
          }}>
            <span style={{ color: "#FFFFFF", fontWeight: "700" }}>{c.ticker}</span>
            <span style={{ color: "#6B7280", marginLeft: "8px" }}>{c.name?.substring(0, 25)}</span>
            <span style={{ 
              marginLeft: "10px", 
              color: c.avg_impact >= 8 ? "#EF4444" : c.avg_impact >= 6 ? "#F59E0B" : "#FBBF24",
              fontWeight: "700",
            }}>
              {c.avg_impact}
            </span>
            <span style={{ color: "#6B7280", marginLeft: "4px", fontSize: "10px" }}>
              · {c.event_count} events
            </span>
          </span>
        ))}
      </div>
      
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
