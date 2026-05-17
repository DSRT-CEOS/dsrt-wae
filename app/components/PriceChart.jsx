"use client";

import { useState, useEffect, useMemo } from "react";

export default function PriceChart({ ticker, currency = "USD" }) {
  const [bars, setBars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("3M");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/company/${ticker}/history?period=${period}`);
        const json = await res.json();
        if (json.success) setBars(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (ticker) load();
  }, [ticker, period]);

  // Calculate chart metrics
  const chartData = useMemo(() => {
    if (bars.length === 0) return null;
    
    const closes = bars.map(b => b.close).filter(c => c != null);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min;
    const first = closes[0];
    const last = closes[closes.length - 1];
    const totalChange = ((last - first) / first) * 100;
    const isUp = totalChange >= 0;
    
    return { min, max, range, first, last, totalChange, isUp, closes };
  }, [bars]);

  const periods = [
    { id: "1M", label: "1M", days: 30 },
    { id: "3M", label: "3M", days: 90 },
    { id: "6M", label: "6M", days: 180 },
    { id: "1Y", label: "1Y", days: 365 },
  ];

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#475569", fontSize: "12px" }}>
        Loading price chart...
      </div>
    );
  }

  if (!chartData || bars.length < 2) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#475569", fontSize: "12px", border: "1px dashed #1E293B", borderRadius: "6px" }}>
        <div style={{ fontSize: "24px", marginBottom: "8px", opacity: 0.5 }}>📊</div>
        No price history available
      </div>
    );
  }

  const { min, max, range, first, last, totalChange, isUp, closes } = chartData;
  const chartColor = isUp ? "#4ADE80" : "#FF3B3B";
  const chartFill = isUp ? "rgba(74, 222, 128, 0.1)" : "rgba(255, 59, 59, 0.1)";

  // Build SVG path
  const width = 100;
  const height = 100;
  const points = closes.map((c, i) => {
    const x = (i / (closes.length - 1)) * width;
    const y = height - ((c - min) / (range || 1)) * height;
    return { x, y };
  });
  
  const linePath = points.map((p, i) => 
    `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`
  ).join(" ");
  
  const fillPath = linePath + 
    ` L${width},${height} L0,${height} Z`;

  const symbol = currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

  return (
    <div>
      {/* Period selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "baseline" }}>
          <span style={{ fontSize: "20px", fontWeight: "bold", color: "#F1F5F9" }}>
            {symbol}{last.toFixed(2)}
          </span>
          <span style={{ fontSize: "12px", color: chartColor, fontWeight: "bold" }}>
            {isUp ? "▲" : "▼"} {Math.abs(totalChange).toFixed(2)}% ({period})
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                padding: "4px 10px",
                fontSize: "10px",
                letterSpacing: "1px",
                fontFamily: "inherit",
                backgroundColor: period === p.id ? "rgba(59, 130, 246, 0.2)" : "transparent",
                border: `1px solid ${period === p.id ? "#3B82F6" : "#1E293B"}`,
                color: period === p.id ? "#60A5FA" : "#64748B",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: period === p.id ? "bold" : "normal",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart SVG */}
      <div style={{ position: "relative", width: "100%", height: "240px", backgroundColor: "rgba(15, 23, 42, 0.4)", borderRadius: "6px", padding: "12px 8px" }}>
        {/* Y-axis labels */}
        <div style={{ position: "absolute", top: "12px", left: "8px", right: "8px", height: "calc(100% - 24px)", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: 0, right: 0, fontSize: "9px", color: "#475569" }}>
            {symbol}{max.toFixed(2)}
          </div>
          <div style={{ position: "absolute", top: "50%", right: 0, fontSize: "9px", color: "#475569", transform: "translateY(-50%)" }}>
            {symbol}{((max + min) / 2).toFixed(2)}
          </div>
          <div style={{ position: "absolute", bottom: 0, right: 0, fontSize: "9px", color: "#475569" }}>
            {symbol}{min.toFixed(2)}
          </div>
        </div>
        
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          preserveAspectRatio="none" 
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          {/* Grid lines */}
          <line x1="0" y1="0" x2={width} y2="0" stroke="#1E293B" strokeWidth="0.2" />
          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#1E293B" strokeWidth="0.2" strokeDasharray="1,1" />
          <line x1="0" y1={height} x2={width} y2={height} stroke="#1E293B" strokeWidth="0.2" />
          
          {/* Fill area */}
          <path d={fillPath} fill={chartFill} />
          
          {/* Line */}
          <path 
            d={linePath} 
            fill="none" 
            stroke={chartColor} 
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* End dot */}
          <circle 
            cx={points[points.length - 1].x} 
            cy={points[points.length - 1].y} 
            r="1.5" 
            fill={chartColor}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Footer stats */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "10px", color: "#64748B" }}>
        <span>Start: {symbol}{first.toFixed(2)}</span>
        <span>{bars.length} trading days</span>
        <span>High: {symbol}{max.toFixed(2)} | Low: {symbol}{min.toFixed(2)}</span>
      </div>
    </div>
  );
}
