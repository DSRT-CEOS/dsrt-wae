"use client";

import { useMemo } from "react";

export default function HeatTrendChart({ data = [], height = 100 }) {
  const chart = useMemo(() => {
    if (data.length === 0) return null;
    
    const values = data.map(d => parseFloat(d.global_heat_index) || 0);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 10);
    const range = max - min || 1;
    
    const width = 100;
    const points = values.map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * height;
      return { x, y, value: v, date: data[i].brief_date, level: data[i].threat_level };
    });
    
    const linePath = points.map((p, i) => 
      `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`
    ).join(" ");
    
    const fillPath = linePath + ` L${width},${height} L0,${height} Z`;
    
    const latest = values[values.length - 1] || 0;
    const previous = values[values.length - 2] || latest;
    const change = latest - previous;
    
    const color = latest >= 6 ? "#EF4444" : latest >= 4 ? "#F59E0B" : "#4ADE80";
    
    return { points, linePath, fillPath, latest, change, color, width };
  }, [data, height]);

  if (!chart) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#6B7280", fontSize: "12px" }}>
        Building 7-day trend...
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "#6B7280", marginBottom: "4px", textTransform: "uppercase", fontWeight: "600" }}>
            7-Day Heat Trend
          </div>
          <div style={{ fontSize: "11px", color: "#9CA3AF" }}>
            Last 7 days global tension
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontSize: "24px", fontWeight: "800", color: chart.color }}>
            {chart.latest.toFixed(1)}
          </span>
          <span style={{ fontSize: "12px", color: chart.change >= 0 ? "#EF4444" : "#4ADE80", fontWeight: "600" }}>
            {chart.change >= 0 ? "↑" : "↓"} {Math.abs(chart.change).toFixed(1)}
          </span>
        </div>
      </div>
      
      <svg viewBox={`0 0 ${chart.width} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height: `${height}px` }}>
        {/* Grid lines */}
        <line x1="0" y1={height * 0.5} x2={chart.width} y2={height * 0.5} stroke="#1F2937" strokeWidth="0.3" strokeDasharray="2,2" />
        
        {/* Fill */}
        <path d={chart.fillPath} fill={chart.color} opacity="0.15" />
        
        {/* Line */}
        <path 
          d={chart.linePath} 
          fill="none" 
          stroke={chart.color} 
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Points */}
        {chart.points.map((p, i) => (
          <circle 
            key={i}
            cx={p.x} 
            cy={p.y} 
            r="1.2" 
            fill={chart.color}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "10px", color: "#6B7280" }}>
        {chart.points.map((p, i) => (
          <span key={i}>
            {new Date(p.date).toLocaleDateString("en-US", { weekday: "short" }).substring(0, 1)}
          </span>
        ))}
      </div>
    </div>
  );
}
