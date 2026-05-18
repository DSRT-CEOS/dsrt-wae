"use client";

import { useState } from "react";
import { useWatchlist } from "../hooks/useWatchlist";

export default function WatchlistButton({ ticker, size = "default" }) {
  const { isWatched, toggleWatchlist, loading } = useWatchlist();
  const [hovering, setHovering] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  
  if (!ticker) return null;
  
  const watched = isWatched(ticker);
  
  const sizes = {
    small: { fontSize: "12px", padding: "4px 10px", iconSize: "11px" },
    default: { fontSize: "11px", padding: "6px 12px", iconSize: "13px" },
    large: { fontSize: "13px", padding: "8px 16px", iconSize: "15px" },
  };
  const s = sizes[size] || sizes.default;
  
  const handleClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    setPulsing(true);
    await toggleWatchlist(ticker);
    setTimeout(() => setPulsing(false), 600);
  };
  
  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: s.padding,
        backgroundColor: watched 
          ? "rgba(252, 211, 77, 0.15)" 
          : "transparent",
        border: `1px solid ${watched ? "#FCD34D" : "#334155"}`,
        color: watched ? "#FCD34D" : "#94A3B8",
        borderRadius: "4px",
        cursor: loading ? "wait" : "pointer",
        fontSize: s.fontSize,
        fontFamily: "inherit",
        letterSpacing: "1px",
        fontWeight: "bold",
        transition: "all 0.15s",
        transform: pulsing ? "scale(1.1)" : "scale(1)",
      }}
    >
      <span style={{ 
        fontSize: s.iconSize,
        filter: watched ? "none" : "grayscale(1)",
      }}>
        {watched ? "★" : "☆"}
      </span>
      <span>
        {watched 
          ? (hovering ? "REMOVE" : "WATCHING") 
          : "+ WATCHLIST"
        }
      </span>
    </button>
  );
}
