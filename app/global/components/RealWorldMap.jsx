"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// Public TopoJSON world map (free CDN)
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country name → lat/lng for event markers
const COUNTRY_COORDS = {
  "United States": [-95.7, 37.0],
  "Canada": [-106.3, 56.1],
  "Mexico": [-102.5, 23.6],
  "Brazil": [-51.9, -14.2],
  "Argentina": [-63.6, -38.4],
  "Venezuela": [-66.5, 6.4],
  "Cuba": [-77.7, 21.5],
  "Colombia": [-74.2, 4.5],
  "Peru": [-75.0, -9.1],
  "Chile": [-71.5, -35.6],
  "United Kingdom": [-3.4, 55.3],
  "France": [2.2, 46.2],
  "Germany": [10.4, 51.1],
  "Italy": [12.5, 41.8],
  "Spain": [-3.7, 40.4],
  "Russia": [105.3, 61.5],
  "Ukraine": [31.1, 48.3],
  "Poland": [19.1, 51.9],
  "Greece": [21.8, 39.0],
  "Sweden": [18.6, 60.1],
  "Norway": [8.4, 60.4],
  "Finland": [25.7, 61.9],
  "Netherlands": [5.2, 52.1],
  "Belgium": [4.4, 50.5],
  "Switzerland": [8.2, 46.8],
  "Austria": [14.5, 47.5],
  "Czech Republic": [15.4, 49.8],
  "Hungary": [19.5, 47.1],
  "Romania": [24.9, 45.9],
  "Bulgaria": [25.4, 42.7],
  "Serbia": [21.0, 44.0],
  "Croatia": [15.2, 45.1],
  "Portugal": [-8.2, 39.3],
  "Ireland": [-8.2, 53.4],
  "Denmark": [9.5, 56.2],
  "Israel": [34.8, 31.0],
  "Palestine": [35.2, 31.9],
  "Iran": [53.6, 32.4],
  "Iraq": [43.6, 33.2],
  "Saudi Arabia": [45.0, 23.8],
  "Turkey": [35.2, 38.9],
  "Syria": [38.9, 34.8],
  "Lebanon": [35.8, 33.8],
  "Yemen": [48.5, 15.5],
  "Egypt": [30.8, 26.8],
  "United Arab Emirates": [54.0, 24.0],
  "UAE": [54.0, 24.0],
  "Qatar": [51.2, 25.3],
  "Kuwait": [47.5, 29.3],
  "Jordan": [36.2, 30.6],
  "Oman": [55.9, 21.5],
  "Nigeria": [8.7, 9.1],
  "South Africa": [22.9, -30.6],
  "Ethiopia": [40.5, 9.1],
  "Kenya": [37.9, -0.0],
  "Sudan": [30.2, 12.9],
  "Morocco": [-7.1, 31.8],
  "Algeria": [1.7, 28.0],
  "Tunisia": [9.5, 33.9],
  "Libya": [17.2, 26.3],
  "Ghana": [-1.0, 7.9],
  "Tanzania": [34.9, -6.4],
  "Uganda": [32.3, 1.4],
  "Zimbabwe": [29.2, -19.0],
  "India": [78.9, 20.6],
  "Pakistan": [69.3, 30.4],
  "Bangladesh": [90.4, 23.7],
  "Afghanistan": [67.7, 33.9],
  "Sri Lanka": [80.8, 7.9],
  "Nepal": [84.1, 28.4],
  "China": [104.2, 35.9],
  "Japan": [138.3, 36.2],
  "South Korea": [127.8, 35.9],
  "North Korea": [127.5, 40.3],
  "Taiwan": [121.0, 23.7],
  "Mongolia": [103.8, 46.9],
  "Hong Kong": [114.1, 22.4],
  "Indonesia": [113.9, -0.8],
  "Vietnam": [108.3, 14.1],
  "Philippines": [121.8, 12.9],
  "Thailand": [100.9, 15.9],
  "Malaysia": [101.9, 4.2],
  "Singapore": [103.8, 1.4],
  "Myanmar": [95.9, 21.9],
  "Cambodia": [104.9, 12.6],
  "Laos": [102.5, 19.9],
  "Australia": [133.8, -25.3],
  "New Zealand": [174.9, -40.9],
  "Papua New Guinea": [143.9, -6.3],
};

export default function RealWorldMap({ events = [], height = 480 }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const getHeatColor = (h) => {
    if (h >= 8) return "#EF4444";
    if (h >= 6) return "#F59E0B";
    if (h >= 4) return "#FBBF24";
    if (h >= 2) return "#60A5FA";
    return "#4ADE80";
  };

  // Aggregate events by country
  const countryEvents = {};
  events.forEach(e => {
    (e.countries || []).forEach(c => {
      if (!COUNTRY_COORDS[c]) return;
      if (!countryEvents[c]) {
        countryEvents[c] = {
          country: c,
          coords: COUNTRY_COORDS[c],
          events: [],
          maxHeat: 0,
        };
      }
      countryEvents[c].events.push(e);
      countryEvents[c].maxHeat = Math.max(countryEvents[c].maxHeat, e.heat_score || 0);
    });
  });

  const countryList = Object.values(countryEvents).sort((a, b) => b.maxHeat - a.maxHeat);

  // Highlight countries with events on the map itself
  const heatCountries = new Map();
  countryList.forEach(c => {
    heatCountries.set(c.country.toLowerCase(), c.maxHeat);
  });

  const getCountryFill = (geo) => {
    const name = geo.properties.name?.toLowerCase() || "";
    
    // Try direct match
    if (heatCountries.has(name)) {
      const h = heatCountries.get(name);
      const c = getHeatColor(h);
      return `${c}33`; // semi-transparent
    }
    
    // Try alt names
    for (const [country, heat] of heatCountries.entries()) {
      if (name.includes(country) || country.includes(name)) {
        const c = getHeatColor(heat);
        return `${c}33`;
      }
    }
    
    return "#1a2538"; // default
  };

  const handleMouseMove = (e, country) => {
    const rect = e.currentTarget.closest("svg").getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setHovered(country);
  };

  return (
    <div style={{ 
      position: "relative", 
      width: "100%",
      backgroundColor: "#0a0e1a",
      borderRadius: "10px",
      border: "1px solid #1F2937",
      overflow: "hidden",
    }}
      onMouseLeave={() => setHovered(null)}
    >
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 160 }}
        style={{ width: "100%", height: `${height}px`, backgroundColor: "transparent" }}
      >
        <defs>
          <filter id="markerGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={getCountryFill(geo)}
                stroke="#1F2937"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "#374151" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {/* Event markers */}
        {countryList.map(c => {
          const color = getHeatColor(c.maxHeat);
          const dotSize = 4 + Math.min(c.events.length, 6);
          const isHovered = hovered?.country === c.country;
          
          return (
            <Marker key={c.country} coordinates={c.coords}>
              <g
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => handleMouseMove(e, c)}
                onMouseMove={(e) => handleMouseMove(e, c)}
                onClick={() => {
                  if (c.events[0]?.slug) {
                    router.push(`/global/article/${c.events[0].slug}`);
                  }
                }}
              >
                {/* Pulse for critical */}
                {c.maxHeat >= 8 && (
                  <circle r={dotSize + 4} fill="none" stroke={color} strokeWidth="1.5" opacity="0.6">
                    <animate attributeName="r" from={dotSize} to={dotSize + 10} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                
                {/* Glow */}
                <circle r={dotSize + 2} fill={color} opacity={isHovered ? "0.5" : "0.25"} filter="url(#markerGlow)" />
                
                {/* Main dot */}
                <circle 
                  r={dotSize} 
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth={isHovered ? "1.5" : "0.5"}
                  opacity={isHovered ? "1" : "0.95"}
                />
              </g>
            </Marker>
          );
        })}
      </ComposableMap>
      
      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: "absolute",
          top: `${tooltipPos.y + 12}px`,
          left: `${tooltipPos.x + 12}px`,
          padding: "12px",
          backgroundColor: "rgba(15, 23, 42, 0.98)",
          backdropFilter: "blur(8px)",
          border: `1px solid ${getHeatColor(hovered.maxHeat)}`,
          borderRadius: "8px",
          color: "#FFFFFF",
          fontSize: "12px",
          minWidth: "240px",
          maxWidth: "320px",
          pointerEvents: "none",
          zIndex: 100,
          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #1F2937" }}>
            <div style={{ fontSize: "13px", color: "#FFFFFF", fontWeight: "700" }}>📍 {hovered.country}</div>
            <div style={{ 
              fontSize: "16px", color: getHeatColor(hovered.maxHeat), fontWeight: "800",
              padding: "2px 8px", backgroundColor: `${getHeatColor(hovered.maxHeat)}22`, borderRadius: "4px",
            }}>
              {hovered.maxHeat.toFixed(1)}
            </div>
          </div>
          
          <div style={{ fontSize: "10px", color: "#6B7280", marginBottom: "8px", letterSpacing: "1px", textTransform: "uppercase", fontWeight: "600" }}>
            {hovered.events.length} ACTIVE EVENT{hovered.events.length !== 1 ? "S" : ""}
          </div>
          
          {hovered.events.slice(0, 4).map((e, i) => (
            <div key={i} style={{ 
              fontSize: "11px", color: "#D1D5DB", lineHeight: "1.4",
              marginBottom: "6px", paddingLeft: "8px",
              borderLeft: `2px solid ${getHeatColor(e.heat_score || 0)}`,
            }}>
              {e.title.substring(0, 90)}{e.title.length > 90 ? "..." : ""}
            </div>
          ))}
          
          {hovered.events.length > 4 && (
            <div style={{ fontSize: "10px", color: "#6B7280", marginTop: "6px", fontStyle: "italic" }}>
              +{hovered.events.length - 4} more events
            </div>
          )}
          
          <div style={{ fontSize: "9px", color: "#4B5563", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #1F2937", letterSpacing: "0.5px" }}>
            CLICK TO READ ANALYSIS
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div style={{ 
        position: "absolute", bottom: "12px", left: "12px", 
        display: "flex", gap: "10px", padding: "8px 12px",
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderRadius: "6px", border: "1px solid #1F2937",
        fontSize: "10px", color: "#9CA3AF", letterSpacing: "0.5px",
      }}>
        <Legend color="#4ADE80" label="STABLE" />
        <Legend color="#FBBF24" label="ELEVATED" />
        <Legend color="#F59E0B" label="HIGH" />
        <Legend color="#EF4444" label="CRITICAL" />
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color, display: "inline-block" }}></span>
      {label}
    </div>
  );
}
