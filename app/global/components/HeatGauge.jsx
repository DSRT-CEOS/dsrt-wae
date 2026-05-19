"use client";

import { useState, useEffect } from "react";

export default function HeatGauge({ value = 0, label = "GLOBAL HEAT", size = 200 }) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animate to value
  useEffect(() => {
    const target = parseFloat(value) || 0;
    const start = displayValue;
    const duration = 1500;
    const startTime = Date.now();
    
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;
      setDisplayValue(current);
      
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [value]);

  // Gauge math
  const max = 10;
  const percent = Math.min(displayValue / max, 1);
  const angle = -90 + (percent * 180); // -90° to +90°
  
  // Color based on value
  const color = displayValue >= 8 ? "#EF4444" 
              : displayValue >= 6 ? "#F59E0B" 
              : displayValue >= 4 ? "#FBBF24" 
              : displayValue >= 2 ? "#60A5FA" 
              : "#4ADE80";
  
  const threat = displayValue >= 8 ? "CRITICAL" 
              : displayValue >= 6 ? "HIGH" 
              : displayValue >= 4 ? "ELEVATED" 
              : displayValue >= 2 ? "MODERATE" 
              : "STABLE";

  const radius = size / 2 - 20;
  const cx = size / 2;
  const cy = size / 2;
  
  // Arc path (semicircle)
  const arcPath = (startAngle, endAngle) => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Needle
  const needleRad = (angle - 90 + 90) * Math.PI / 180;
  const needleX = cx + (radius - 10) * Math.cos((angle) * Math.PI / 180);
  const needleY = cy + (radius - 10) * Math.sin((angle) * Math.PI / 180);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Background arc */}
        <path
          d={arcPath(-90, 90)}
          fill="none"
          stroke="#1F2937"
          strokeWidth="16"
          strokeLinecap="round"
        />
        
        {/* Colored zones */}
        <path d={arcPath(-90, -54)} fill="none" stroke="#4ADE80" strokeWidth="16" strokeLinecap="round" opacity="0.3" />
        <path d={arcPath(-54, -18)} fill="none" stroke="#60A5FA" strokeWidth="16" strokeLinecap="round" opacity="0.3" />
        <path d={arcPath(-18, 18)} fill="none" stroke="#FBBF24" strokeWidth="16" strokeLinecap="round" opacity="0.3" />
        <path d={arcPath(18, 54)} fill="none" stroke="#F59E0B" strokeWidth="16" strokeLinecap="round" opacity="0.3" />
        <path d={arcPath(54, 90)} fill="none" stroke="#EF4444" strokeWidth="16" strokeLinecap="round" opacity="0.3" />
        
        {/* Active progress arc */}
        <path
          d={arcPath(-90, angle)}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 8px ${color}66)`,
            transition: "all 0.3s",
          }}
        />
        
        {/* Center hub */}
        <circle cx={cx} cy={cy} r="8" fill="#111827" stroke={color} strokeWidth="2" />
        
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
        
        {/* Value text */}
        <text 
          x={cx} 
          y={cy + 30} 
          textAnchor="middle" 
          fill="#FFFFFF"
          fontSize="36"
          fontWeight="800"
          fontFamily="'Inter', sans-serif"
        >
          {displayValue.toFixed(1)}
        </text>
        
        <text 
          x={cx} 
          y={cy + 50} 
          textAnchor="middle" 
          fill="#6B7280"
          fontSize="10"
          fontWeight="600"
          letterSpacing="2"
          fontFamily="'Inter', sans-serif"
        >
          / 10
        </text>
      </svg>
      
      <div style={{ marginTop: "-10px", textAlign: "center" }}>
        <div style={{ 
          fontSize: "11px", 
          letterSpacing: "2px", 
          color: "#6B7280",
          textTransform: "uppercase",
          fontWeight: "600",
          marginBottom: "4px",
        }}>
          {label}
        </div>
        <div style={{ 
          fontSize: "14px", 
          color, 
          fontWeight: "800",
          letterSpacing: "1.5px",
        }}>
          ● {threat}
        </div>
      </div>
    </div>
  );
}
