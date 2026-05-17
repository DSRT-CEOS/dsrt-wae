"use client";

import { useState, useEffect, useMemo, useRef } from "react";

export default function PriceChart({ ticker, currency = "USD" }) {
  const [bars, setBars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("3M");
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
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

  const chartData = useMemo(() => {
    if (bars.length === 0) return null;
    const closes = bars.map(b => b.close).filter(c => c != null);
    if (closes.length === 0) return null;
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;
    const first = closes[0];
    const last = closes[closes.length - 1];
    const totalChange = ((last - first) / first) * 100;
    const isUp = totalChange >= 0;
    return { min, max, range, first, last, totalChange, isUp, closes };
  }, [bars]);

  const periods = [
    { id: "1M", label: "1M" },
    { id: "3M", label: "3M" },
    { id: "6M", label: "6M" },
    { id: "1Y", label: "1Y" },
  ];

  const symbol = currency === "INR" ? "₹" : 
                 currency === "EUR" ? "€" : 
                 currency === "GBP" ? "£" : 
                 currency === "JPY" ? "¥" : "$";

  const formatPrice = (n) => {
    if (n == null) return "—";
    if (n >= 1000) return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
    return n.toFixed(2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

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
  const chartFill = isUp ? "rgba(74, 222, 128, 0.15)" : "rgba(255, 59, 59, 0.15)";

  // SVG geometry
  const width = 100;
  const height = 100;
  const points = closes.map((c, i) => {
    const x = (i / (closes.length - 1)) * width;
    const y = height - ((c - min) / range) * height;
    return { x, y, value: c, date: bars[i]?.date, idx: i, bar: bars[i] };
  });

  const linePath = points.map((p, i) => 
    `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`
  ).join(" ");

  const fillPath = linePath + ` L${width},${height} L0,${height} Z`;

  // Hover handler
  const handleMouseMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const idx = Math.round(ratio * (points.length - 1));
    const clamped = Math.max(0, Math.min(points.length - 1, idx));
    setHoverIdx(clamped);
  };

  const handleMouseLeave = () => {
    setHoverIdx(null);
  };

  // Active point (hovered or last)
  const activePoint = hoverIdx !== null ? points[hoverIdx] : points[points.length - 1];
  const hoverChange = hoverIdx !== null && hoverIdx > 0
    ? ((activePoint.value - first) / first) * 100
    : totalChange;
  const hoverChangeColor = hoverChange >= 0 ? "#4ADE80" : "#FF3B3B";

  return (
    <div>
      {/* HEADER: Current price + period selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#F1F5F9", letterSpacing: "0.5px" }}>
              {symbol}{formatPrice(activePoint.value)}
            </span>
            <span style={{ fontSize: "13px", color: hoverChangeColor, fontWeight: "bold" }}>
              {hoverChange >= 0 ? "▲" : "▼"} {Math.abs(hoverChange).toFixed(2)}% ({period})
            </span>
          </div>
          {hoverIdx !== null && (
            <div style={{ fontSize: "10px", color: "#64748B", marginTop: "4px", letterSpacing: "1px" }}>
              ● {formatDate(activePoint.date)} · Day {hoverIdx + 1} of {points.length}
            </div>
          )}
        </div>
        
        <div style={{ display: "flex", gap: "4px" }}>
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                padding: "5px 12px",
                fontSize: "10px",
                letterSpacing: "1px",
                fontFamily: "inherit",
                fontWeight: "bold",
                backgroundColor: period === p.id ? "rgba(59, 130, 246, 0.2)" : "transparent",
                border: `1px solid ${period === p.id ? "#3B82F6" : "#1E293B"}`,
                color: period === p.id ? "#60A5FA" : "#64748B",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* CHART CONTAINER */}
      <div 
        style={{ 
          position: "relative", 
          width: "100%", 
          height: "260px", 
          backgroundColor: "rgba(15, 23, 42, 0.4)", 
          borderRadius: "8px", 
          padding: "16px 50px 16px 12px",
          overflow: "hidden",
        }}
      >
        {/* Y-axis labels (right side) */}
        <div style={{ position: "absolute", top: "16px", right: "8px", bottom: "16px", width: "40px", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: 0, right: 0, fontSize: "10px", color: "#475569", fontFamily: "inherit" }}>
            {symbol}{formatPrice(max)}
          </div>
          <div style={{ position: "absolute", top: "33%", right: 0, fontSize: "10px", color: "#475569", fontFamily: "inherit" }}>
            {symbol}{formatPrice(min + range * 0.67)}
          </div>
          <div style={{ position: "absolute", top: "66%", right: 0, fontSize: "10px", color: "#475569", fontFamily: "inherit" }}>
            {symbol}{formatPrice(min + range * 0.33)}
          </div>
          <div style={{ position: "absolute", bottom: 0, right: 0, fontSize: "10px", color: "#475569", fontFamily: "inherit" }}>
            {symbol}{formatPrice(min)}
          </div>
        </div>

        {/* SVG Chart */}
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`} 
          preserveAspectRatio="none" 
          style={{ width: "100%", height: "100%", overflow: "visible", cursor: "crosshair" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines */}
          <line x1="0" y1="0" x2={width} y2="0" stroke="#1E293B" strokeWidth="0.15" />
          <line x1="0" y1={height * 0.33} x2={width} y2={height * 0.33} stroke="#1E293B" strokeWidth="0.15" strokeDasharray="0.5,0.5" />
          <line x1="0" y1={height * 0.67} x2={width} y2={height * 0.67} stroke="#1E293B" strokeWidth="0.15" strokeDasharray="0.5,0.5" />
          <line x1="0" y1={height} x2={width} y2={height} stroke="#1E293B" strokeWidth="0.15" />
          
          {/* Fill area */}
          <path d={fillPath} fill={chartFill} />
          
          {/* Main line */}
          <path 
            d={linePath} 
            fill="none" 
            stroke={chartColor} 
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Hover crosshair line */}
          {hoverIdx !== null && (
            <>
              <line 
                x1={activePoint.x} y1="0" 
                x2={activePoint.x} y2={height} 
                stroke="#94A3B8" 
                strokeWidth="0.3"
                strokeDasharray="1,1"
                vectorEffect="non-scaling-stroke"
              />
              <line 
                x1="0" y1={activePoint.y} 
                x2={width} y2={activePoint.y} 
                stroke="#94A3B8" 
                strokeWidth="0.3"
                strokeDasharray="1,1"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
          
          {/* Active point dot */}
          <circle 
            cx={activePoint.x} 
            cy={activePoint.y} 
            r="1.5" 
            fill={chartColor}
            stroke="#030712"
            strokeWidth="0.4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Tooltip Box (positioned absolutely over chart) */}
        {hoverIdx !== null && activePoint.bar && (
          <div style={{
            position: "absolute",
            top: "12px",
            left: `${(activePoint.x / width) * 100}%`,
            transform: hoverIdx > points.length / 2 ? "translateX(-105%)" : "translateX(10px)",
            backgroundColor: "rgba(3, 7, 18, 0.95)",
            border: `1px solid ${chartColor}`,
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "10px",
            color: "#E2E8F0",
            pointerEvents: "none",
            minWidth: "140px",
            backdropFilter: "blur(4px)",
            boxShadow: `0 4px 12px rgba(0,0,0,0.4)`,
            zIndex: 10,
          }}>
            <div style={{ fontSize: "9px", color: "#64748B", letterSpacing: "1px", marginBottom: "4px" }}>
              {formatDate(activePoint.bar.date)}
            </div>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: chartColor, marginBottom: "6px" }}>
              {symbol}{formatPrice(activePoint.value)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 8px", fontSize: "9px" }}>
              <span style={{ color: "#64748B" }}>OPEN</span>
              <span style={{ color: "#E2E8F0", textAlign: "right" }}>{symbol}{formatPrice(activePoint.bar.open)}</span>
              <span style={{ color: "#64748B" }}>HIGH</span>
              <span style={{ color: "#4ADE80", textAlign: "right" }}>{symbol}{formatPrice(activePoint.bar.high)}</span>
              <span style={{ color: "#64748B" }}>LOW</span>
              <span style={{ color: "#FF8C42", textAlign: "right" }}>{symbol}{formatPrice(activePoint.bar.low)}</span>
              <span style={{ color: "#64748B" }}>CLOSE</span>
              <span style={{ color: "#E2E8F0", textAlign: "right", fontWeight: "bold" }}>{symbol}{formatPrice(activePoint.bar.close)}</span>
              {activePoint.bar.volume != null && (
                <>
                  <span style={{ color: "#64748B" }}>VOL</span>
                  <span style={{ color: "#94A3B8", textAlign: "right" }}>
                    {activePoint.bar.volume >= 1e6 ? `${(activePoint.bar.volume/1e6).toFixed(1)}M` :
                     activePoint.bar.volume >= 1e3 ? `${(activePoint.bar.volume/1e3).toFixed(0)}K` :
                     activePoint.bar.volume}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "10px", color: "#64748B" }}>
        <span>Start: {symbol}{formatPrice(first)}</span>
        <span>{bars.length} trading days</span>
        <span>High: {symbol}{formatPrice(max)} | Low: {symbol}{formatPrice(min)}</span>
      </div>
    </div>
  );
}
