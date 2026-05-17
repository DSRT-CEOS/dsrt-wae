"use client";

import CompanySearch from "./CompanySearch";

export default function Header({ lastRefresh, status, onRefresh }) {
  const formatTime = (date) => {
    if (!date) return "Loading...";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
  };

  const isError = status === "error";

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      backdropFilter: "blur(8px)",
      borderBottom: "1px solid #1E293B",
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "28px" }}>🌍</span>
          <div>
            <h1 style={{
              fontSize: "16px", fontWeight: "bold", letterSpacing: "3px",
              margin: 0, color: "#E2E8F0",
            }}>
              DSRT <span style={{ color: "#3B82F6" }}>WAE</span>
            </h1>
            <p style={{
              fontSize: "9px", letterSpacing: "2px", color: "#64748B",
              margin: 0, textTransform: "uppercase",
            }}>
              World AI Engine
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <CompanySearch />

        {/* Status + Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "11px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              width: "8px", height: "8px", borderRadius: "50%",
              backgroundColor: isError ? "#FF0000" : "#00CC00",
              animation: "blink 1.5s ease-in-out infinite",
              display: "inline-block",
            }} />
            <span style={{ color: isError ? "#FF6B6B" : "#4ADE80", fontWeight: "bold" }}>
              {isError ? "ERROR" : "LIVE"}
            </span>
          </div>

          <span style={{ color: "#64748B" }}>
            {formatTime(lastRefresh)}
          </span>

          <button
            onClick={onRefresh}
            style={{
              padding: "6px 12px",
              backgroundColor: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "4px",
              color: "#E2E8F0",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "inherit",
            }}
          >
            ↻ REFRESH
          </button>

          <span style={{ 
            color: "#475569", fontSize: "10px",
            padding: "3px 8px",
            border: "1px solid #1E293B",
            borderRadius: "3px",
          }}>
            v2.0
          </span>
        </div>
      </div>
    </header>
  );
}
