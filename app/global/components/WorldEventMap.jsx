"use client";

import { useState } from "react";

// Approximate lat/lng for major world regions (SVG coordinates)
// SVG world map viewbox: 1000 x 500
const REGION_COORDS = {
  "North America": { x: 230, y: 180, label: "N. AMERICA" },
  "South America": { x: 340, y: 340, label: "S. AMERICA" },
  "Europe": { x: 510, y: 165, label: "EUROPE" },
  "Middle East": { x: 580, y: 220, label: "MID EAST" },
  "Africa": { x: 530, y: 290, label: "AFRICA" },
  "South Asia": { x: 685, y: 235, label: "S. ASIA" },
  "Central Asia": { x: 640, y: 175, label: "C. ASIA" },
  "East Asia": { x: 780, y: 200, label: "E. ASIA" },
  "Southeast Asia": { x: 770, y: 280, label: "SE ASIA" },
  "Oceania": { x: 830, y: 380, label: "OCEANIA" },
  "Arctic": { x: 500, y: 60, label: "ARCTIC" },
  "Global": { x: 500, y: 100, label: "GLOBAL" },
};

export default function WorldEventMap({ regionalHeat = {}, regionalActivity = [], onRegionClick, activeRegion }) {
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const getHeatColor = (h) => {
    const v = parseFloat(h) || 0;
    if (v >= 8) return "#EF4444";
    if (v >= 6) return "#F59E0B";
    if (v >= 4) return "#FBBF24";
    if (v >= 2) return "#60A5FA";
    return "#4ADE80";
  };

  // Build region data from BOTH sources for richest info
  const regionData = {};
  
  Object.entries(regionalHeat).forEach(([region, heat]) => {
    if (!REGION_COORDS[region]) return;
    regionData[region] = {
      region,
      heat: parseFloat(heat) || 0,
      coords: REGION_COORDS[region],
      eventCount: 0,
    };
  });
  
  regionalActivity.forEach(({ region, event_count, avg_heat }) => {
    if (!REGION_COORDS[region]) return;
    if (!regionData[region]) {
      regionData[region] = {
        region,
        heat: avg_heat || 0,
        coords: REGION_COORDS[region],
        eventCount: 0,
      };
    }
    regionData[region].eventCount = event_count || 0;
  });

  const regions = Object.values(regionData);

  return (
    <div style={{ position: "relative", width: "100%", backgroundColor: "#0a0e1a", borderRadius: "12px", border: "1px solid #1F2937", overflow: "hidden" }}>
      
      <svg 
        viewBox="0 0 1000 500" 
        style={{ width: "100%", height: "auto", display: "block" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background grid (subtle) */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1F2937" strokeWidth="0.5" opacity="0.3" />
          </pattern>
          
          {/* Glow filter for dots */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <radialGradient id="oceanGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(15, 23, 42, 0.4)" />
            <stop offset="100%" stopColor="rgba(10, 14, 26, 0.1)" />
          </radialGradient>
        </defs>
        
        <rect width="1000" height="500" fill="url(#grid)" />
        <rect width="1000" height="500" fill="url(#oceanGrad)" />
        
        {/* Simplified continent shapes (rough outlines) */}
        <g fill="#1a2538" stroke="#1F2937" strokeWidth="0.8" opacity="0.6">
          {/* North America */}
          <path d="M 100 100 Q 150 80 200 90 L 280 95 Q 320 110 340 150 L 350 200 Q 340 250 300 270 L 250 280 Q 200 270 170 240 L 130 200 Q 100 160 100 100 Z" />
          
          {/* South America */}
          <path d="M 280 290 Q 320 280 360 300 L 380 350 Q 370 400 340 430 L 310 440 Q 290 420 280 380 L 275 330 Q 275 305 280 290 Z" />
          
          {/* Europe */}
          <path d="M 460 130 Q 490 120 530 130 L 570 140 Q 580 170 570 195 L 550 210 Q 520 215 490 200 L 470 180 Q 455 155 460 130 Z" />
          
          {/* Africa */}
          <path d="M 480 220 Q 520 215 560 225 L 590 260 Q 600 310 580 350 L 540 370 Q 500 360 480 320 L 470 270 Q 470 240 480 220 Z" />
          
          {/* Middle East */}
          <path d="M 550 200 Q 580 195 615 210 L 625 240 Q 615 260 590 265 L 560 255 Q 545 230 550 200 Z" />
          
          {/* Central + South Asia */}
          <path d="M 620 150 Q 660 140 720 160 L 730 220 Q 715 260 680 270 L 650 260 Q 625 230 620 200 L 620 150 Z" />
          
          {/* East Asia */}
          <path d="M 730 140 Q 780 135 830 155 L 850 200 Q 840 230 800 235 L 770 225 Q 740 200 730 175 L 730 140 Z" />
          
          {/* Southeast Asia */}
          <path d="M 740 260 Q 780 255 810 275 L 815 305 Q 800 320 770 315 L 750 300 Q 735 280 740 260 Z" />
          
          {/* Oceania (Australia) */}
          <path d="M 790 360 Q 830 355 870 370 L 880 400 Q 870 420 840 425 L 810 420 Q 790 405 790 360 Z" />
        </g>
        
        {/* Region labels (faint background) */}
        {regions.map(r => (
          <text 
            key={`label-${r.region}`}
            x={r.coords.x} 
            y={r.coords.y - 18}
            fill="#4B5563"
            fontSize="9"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="'Inter', sans-serif"
            letterSpacing="0.5"
          >
            {r.coords.label}
          </text>
        ))}
        
        {/* Event dots */}
        {regions.map(r => {
          const color = getHeatColor(r.heat);
          const baseSize = 6;
          const dotSize = baseSize + Math.min(r.eventCount / 2, 20);
          const isHovered = hoveredRegion === r.region;
          const isActive = activeRegion === r.region;
          
          return (
            <g 
              key={r.region}
              transform={`translate(${r.coords.x}, ${r.coords.y})`}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredRegion(r.region)}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onRegionClick && onRegionClick(r.region)}
            >
              {/* Pulse ring (animated) */}
              {r.heat >= 6 && (
                <circle 
                  r={dotSize + 8}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  opacity="0.5"
                >
                  <animate attributeName="r" from={dotSize} to={dotSize + 20} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              
              {/* Outer glow */}
              <circle 
                r={dotSize + 4}
                fill={color}
                opacity={isHovered || isActive ? "0.4" : "0.2"}
                filter="url(#glow)"
              />
              
              {/* Main dot */}
              <circle 
                r={dotSize}
                fill={color}
                stroke="#FFFFFF"
                strokeWidth={isActive ? "2" : "0"}
                opacity={isHovered || isActive ? "1" : "0.9"}
              />
              
              {/* Heat value */}
              <text 
                y="3"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="9"
                fontWeight="800"
                fontFamily="'Inter', sans-serif"
              >
                {r.heat.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Hover tooltip */}
      {hoveredRegion && regionData[hoveredRegion] && (
        <div style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          padding: "16px",
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(8px)",
          border: `1px solid ${getHeatColor(regionData[hoveredRegion].heat)}`,
          borderRadius: "8px",
          color: "#FFFFFF",
          fontSize: "13px",
          minWidth: "180px",
          pointerEvents: "none",
        }}>
          <div style={{ fontSize: "10px", color: "#6B7280", letterSpacing: "1.5px", marginBottom: "8px", textTransform: "uppercase", fontWeight: "700" }}>
            {hoveredRegion}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "#9CA3AF" }}>Heat Score</span>
            <span style={{ color: getHeatColor(regionData[hoveredRegion].heat), fontWeight: "700" }}>
              {regionData[hoveredRegion].heat.toFixed(1)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#9CA3AF" }}>Events (24h)</span>
            <span style={{ color: "#FFFFFF", fontWeight: "700" }}>
              {regionData[hoveredRegion].eventCount}
            </span>
          </div>
          <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #1F2937", fontSize: "10px", color: "#6B7280", letterSpacing: "0.5px" }}>
            CLICK TO FILTER ARTICLES
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div style={{ 
        position: "absolute", 
        bottom: "16px", 
        left: "16px", 
        display: "flex", 
        gap: "12px", 
        padding: "10px 14px",
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderRadius: "8px",
        border: "1px solid #1F2937",
        fontSize: "10px",
        color: "#9CA3AF",
        letterSpacing: "0.5px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4ADE80", display: "inline-block" }}></span>
          STABLE
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#FBBF24", display: "inline-block" }}></span>
          ELEVATED
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F59E0B", display: "inline-block" }}></span>
          HIGH
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#EF4444", display: "inline-block" }}></span>
          CRITICAL
        </div>
      </div>
    </div>
  );
}
