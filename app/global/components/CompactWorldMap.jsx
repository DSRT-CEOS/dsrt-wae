"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Country coordinates on simplified world map (SVG viewBox 1000x500)
const COUNTRY_COORDS = {
  // North America
  "United States": { x: 220, y: 190 },
  "Canada": { x: 220, y: 130 },
  "Mexico": { x: 200, y: 240 },
  
  // South America
  "Brazil": { x: 360, y: 320 },
  "Argentina": { x: 330, y: 400 },
  "Venezuela": { x: 320, y: 270 },
  "Cuba": { x: 270, y: 240 },
  
  // Europe
  "United Kingdom": { x: 475, y: 145 },
  "France": { x: 485, y: 170 },
  "Germany": { x: 510, y: 155 },
  "Italy": { x: 515, y: 185 },
  "Spain": { x: 470, y: 195 },
  "Russia": { x: 620, y: 130 },
  "Ukraine": { x: 560, y: 165 },
  "Poland": { x: 525, y: 150 },
  "Greece": { x: 540, y: 195 },
  "Sweden": { x: 520, y: 110 },
  "Norway": { x: 505, y: 110 },
  "Finland": { x: 540, y: 100 },
  "Netherlands": { x: 495, y: 145 },
  "Belgium": { x: 490, y: 155 },
  
  // Middle East
  "Israel": { x: 570, y: 220 },
  "Palestine": { x: 570, y: 222 },
  "Iran": { x: 615, y: 215 },
  "Iraq": { x: 595, y: 215 },
  "Saudi Arabia": { x: 595, y: 240 },
  "Turkey": { x: 565, y: 195 },
  "Syria": { x: 575, y: 205 },
  "Lebanon": { x: 572, y: 213 },
  "Yemen": { x: 605, y: 265 },
  "Egypt": { x: 555, y: 235 },
  "UAE": { x: 615, y: 245 },
  
  // Africa
  "Nigeria": { x: 510, y: 280 },
  "South Africa": { x: 540, y: 380 },
  "Ethiopia": { x: 580, y: 285 },
  "Kenya": { x: 580, y: 305 },
  "Sudan": { x: 565, y: 265 },
  "Morocco": { x: 470, y: 220 },
  "Algeria": { x: 495, y: 230 },
  
  // South Asia
  "India": { x: 680, y: 240 },
  "Pakistan": { x: 660, y: 220 },
  "Bangladesh": { x: 705, y: 240 },
  "Afghanistan": { x: 655, y: 205 },
  
  // East Asia
  "China": { x: 760, y: 200 },
  "Japan": { x: 845, y: 200 },
  "South Korea": { x: 820, y: 200 },
  "North Korea": { x: 815, y: 185 },
  "Taiwan": { x: 800, y: 230 },
  "Mongolia": { x: 750, y: 165 },
  
  // Southeast Asia
  "Indonesia": { x: 790, y: 310 },
  "Vietnam": { x: 775, y: 260 },
  "Philippines": { x: 815, y: 270 },
  "Thailand": { x: 760, y: 260 },
  "Malaysia": { x: 775, y: 290 },
  
  // Oceania
  "Australia": { x: 830, y: 380 },
  "New Zealand": { x: 890, y: 410 },
};

const REGION_DEFAULT = { x: 500, y: 250 };

export default function CompactWorldMap({ events = [], onCountryClick }) {
  const router = useRouter();
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Aggregate events by country
  const countryEvents = {};
  
  events.forEach(e => {
    const countries = e.countries || [];
    countries.forEach(c => {
      if (!COUNTRY_COORDS[c]) return; // Only mapped countries
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

  const getHeatColor = (h) => {
    if (h >= 8) return "#EF4444";
    if (h >= 6) return "#F59E0B";
    if (h >= 4) return "#FBBF24";
    if (h >= 2) return "#60A5FA";
    return "#4ADE80";
  };

  const countryList = Object.values(countryEvents).sort((a, b) => b.maxHeat - a.maxHeat);

  const handleMouseMove = (e, country) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setHoveredCountry(country);
  };

  return (
    <div style={{ 
      position: "relative", 
      width: "100%",
      backgroundColor: "#0a0e1a", 
      borderRadius: "10px", 
      border: "1px solid #1F2937", 
      overflow: "hidden",
    }}>
      
      <svg 
        viewBox="0 0 1000 500" 
        style={{ width: "100%", height: "auto", display: "block" }}
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHoveredCountry(null)}
      >
        {/* Grid + Ocean background */}
        <defs>
          <pattern id="gridSmall" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1F2937" strokeWidth="0.5" opacity="0.3" />
          </pattern>
          <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <rect width="1000" height="500" fill="url(#gridSmall)" />
        
        {/* Continent shapes — more accurate outlines */}
        <g fill="#1a2538" stroke="#1F2937" strokeWidth="0.8" opacity="0.6">
          {/* North America */}
          <path d="M 80 80 Q 120 70 180 75 L 270 90 Q 310 120 330 160 L 340 220 Q 320 260 280 270 L 230 275 Q 180 265 145 235 L 115 195 Q 85 155 80 80 Z" />
          
          {/* Central America */}
          <path d="M 180 240 Q 210 250 240 260 L 250 280 Q 240 290 220 285 L 200 275 Q 185 260 180 240 Z" />
          
          {/* South America */}
          <path d="M 290 280 Q 330 270 365 285 L 385 340 Q 380 400 350 440 L 320 450 Q 295 430 285 380 L 280 320 Q 280 295 290 280 Z" />
          
          {/* Europe */}
          <path d="M 450 110 Q 490 105 530 115 L 570 130 Q 595 155 580 195 L 555 215 Q 510 225 470 210 L 450 185 Q 440 150 450 110 Z" />
          
          {/* Russia (wider) */}
          <path d="M 570 110 Q 640 100 720 110 L 780 130 Q 800 150 790 175 L 750 185 Q 690 180 620 175 L 580 165 Q 565 140 570 110 Z" />
          
          {/* Africa */}
          <path d="M 460 220 Q 510 215 560 230 L 595 270 Q 610 320 590 365 L 545 385 Q 500 380 475 340 L 460 285 Q 455 245 460 220 Z" />
          
          {/* Middle East */}
          <path d="M 545 195 Q 580 190 625 205 L 640 240 Q 625 270 595 275 L 560 265 Q 540 230 545 195 Z" />
          
          {/* India / South Asia */}
          <path d="M 640 200 Q 680 195 720 215 L 730 260 Q 715 280 685 285 L 655 275 Q 640 240 640 200 Z" />
          
          {/* East Asia / China */}
          <path d="M 720 140 Q 790 135 850 160 L 860 210 Q 845 235 800 240 L 760 230 Q 725 200 720 170 L 720 140 Z" />
          
          {/* Japan */}
          <path d="M 825 175 Q 855 170 865 195 L 855 220 Q 835 220 825 200 L 825 175 Z" />
          
          {/* SE Asia */}
          <path d="M 740 255 Q 790 250 820 275 L 820 310 Q 800 320 770 315 L 745 295 Q 735 275 740 255 Z" />
          
          {/* Indonesia */}
          <path d="M 760 305 Q 800 300 830 315 L 825 330 Q 805 335 775 330 L 760 320 Q 755 310 760 305 Z" />
          
          {/* Australia */}
          <path d="M 800 365 Q 845 360 885 375 L 895 405 Q 880 425 845 430 L 815 425 Q 795 410 800 365 Z" />
        </g>
        
        {/* Country dots */}
        {countryList.map(cd => {
          const color = getHeatColor(cd.maxHeat);
          const eventCount = cd.events.length;
          const dotSize = 4 + Math.min(eventCount, 8);
          const isHovered = hoveredCountry?.country === cd.country;
          
          return (
            <g 
              key={cd.country}
              transform={`translate(${cd.coords.x}, ${cd.coords.y})`}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => handleMouseMove(e, cd)}
              onMouseMove={(e) => handleMouseMove(e, cd)}
              onClick={() => {
                if (cd.events.length > 0 && cd.events[0].slug) {
                  router.push(`/global/article/${cd.events[0].slug}`);
                } else if (onCountryClick) {
                  onCountryClick(cd.country);
                }
              }}
            >
              {/* Pulse for critical heat */}
              {cd.maxHeat >= 8 && (
                <circle r={dotSize + 6} fill="none" stroke={color} strokeWidth="1.5" opacity="0.6">
                  <animate attributeName="r" from={dotSize} to={dotSize + 12} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              
              {/* Outer glow */}
              <circle r={dotSize + 2} fill={color} opacity={isHovered ? "0.5" : "0.25"} filter="url(#dotGlow)" />
              
              {/* Main dot */}
              <circle 
                r={dotSize} 
                fill={color}
                stroke="#FFFFFF"
                strokeWidth={isHovered ? "1.5" : "0.5"}
                opacity={isHovered ? "1" : "0.9"}
              />
            </g>
          );
        })}
      </svg>
      
      {/* Tooltip */}
      {hoveredCountry && (
        <div style={{
          position: "absolute",
          top: `${tooltipPos.y + 12}px`,
          left: `${tooltipPos.x + 12}px`,
          padding: "12px",
          backgroundColor: "rgba(15, 23, 42, 0.98)",
          backdropFilter: "blur(8px)",
          border: `1px solid ${getHeatColor(hoveredCountry.maxHeat)}`,
          borderRadius: "8px",
          color: "#FFFFFF",
          fontSize: "12px",
          minWidth: "220px",
          maxWidth: "280px",
          pointerEvents: "none",
          zIndex: 10,
          boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #1F2937" }}>
            <div style={{ fontSize: "13px", color: "#FFFFFF", fontWeight: "700" }}>
              📍 {hoveredCountry.country}
            </div>
            <div style={{ 
              fontSize: "16px", 
              color: getHeatColor(hoveredCountry.maxHeat), 
              fontWeight: "800",
              padding: "2px 8px",
              backgroundColor: `${getHeatColor(hoveredCountry.maxHeat)}22`,
              borderRadius: "4px",
            }}>
              {hoveredCountry.maxHeat.toFixed(1)}
            </div>
          </div>
          
          <div style={{ fontSize: "10px", color: "#6B7280", marginBottom: "8px", letterSpacing: "1px", textTransform: "uppercase", fontWeight: "600" }}>
            {hoveredCountry.events.length} ACTIVE EVENT{hoveredCountry.events.length !== 1 ? "S" : ""}
          </div>
          
          {hoveredCountry.events.slice(0, 3).map((e, i) => (
            <div key={i} style={{ 
              fontSize: "11px", 
              color: "#D1D5DB", 
              lineHeight: "1.4",
              marginBottom: "6px",
              paddingLeft: "8px",
              borderLeft: `2px solid ${getHeatColor(e.heat_score || 0)}`,
            }}>
              {e.title.substring(0, 80)}{e.title.length > 80 ? "..." : ""}
            </div>
          ))}
          
          {hoveredCountry.events.length > 3 && (
            <div style={{ fontSize: "10px", color: "#6B7280", marginTop: "6px", fontStyle: "italic" }}>
              +{hoveredCountry.events.length - 3} more events
            </div>
          )}
          
          <div style={{ fontSize: "9px", color: "#4B5563", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #1F2937", letterSpacing: "0.5px" }}>
            CLICK TO READ ANALYSIS
          </div>
        </div>
      )}
    </div>
  );
}
