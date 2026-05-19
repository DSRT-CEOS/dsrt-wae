"use client";

import { useMemo } from "react";

// Inline mini chart for embedding in article body
export default function InlineSparkline({ 
  title = "Related Activity",
  data = [],  // Array of {label, value}
  color = "#3B82F6",
  height = 80,
}) {
  const chart = useMemo(() => {
    if (!data || data.length === 0) return null;
    const values = data.map(d => parseFloat(d.value) || 0);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const range = max - min || 1;
    const width = 100;
    const points = values.map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * height;
      return { x, y, value: v, label: data[i].label };
    });
    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
    const fillPath = linePath + ` L${width},${height} L0,${height} Z`;
    return { points, linePath, fillPath, min, max, width };
  }, [data, height]);

  if (!chart) return null;

  return (
    <div style={{
      margin: "24px 0",
      padding: "16px 20px",
      backgroundColor: "#0F1623",
      border: "1px solid #1F2937",
      borderRadius: "8px",
    }}>
      <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#6B7280", marginBottom: "12px", textTransform: "uppercase", fontWeight: "700" }}>
        📊 {title}
      </div>
      <svg viewBox={`0 0 ${chart.width} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height: `${height}px` }}>
        <path d={chart.fillPath} fill={color} opacity="0.15" />
        <path d={chart.linePath} fill="none" stroke={color} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        {chart.points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.2" fill={color} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "10px", color: "#6B7280" }}>
        {chart.points.map((p, i) => (
          <span key={i}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}
