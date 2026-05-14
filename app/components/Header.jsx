"use client";

// ============================================
// DSRT WAE — Header Component
// Sticky top bar with logo, status, last update
// ============================================

export default function Header({ lastRefresh, status, onRefresh }) {
  const formatTime = (date) => {
    if (!date) return "Loading...";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
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
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        {/* Left: Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "28px" }}>🌍</span>
          <div>
            <h1 style={{
              fontSize: "16px",
              fontWeight: "bold",
              letterSpacing: "3px",
              margin: 0,
              color: "#E2E8F0",
            }}>
              DSRT <span style={{ color: "#3B82F6" }}>WAE</span>
            </h1>
            <p style={{
              fontSize: "9px",
              letterSpacing: "2px",
              color: "#64748B",
              margin: 0,
              textTransform: "uppercase",
            }}>
              World AI Engine • Monitoring 190+ Countries
            </p>
          </div>
        </div>

        {/* Right: Status + Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "11px" }}>
          {/* Status Dot */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: isError ? "#FF0000" : "#00CC00",
                animation: "blink 1.5s ease-in-out infinite",
                display: "inline-block",
              }}
            />
            <span style={{ color: isError ? "#FF6B6B" : "#4ADE80", fontWeight: "bold" }}>
              {isError ? "ERROR" : "LIVE"}
            </span>
          </div>

          {/* Last Update */}
          <span style={{ color: "#64748B" }}>
            Updated: {formatTime(lastRefresh)}
          </span>

          {/* Refresh Button */}
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
            onMouseOver={(e) => e.target.style.backgroundColor = "#334155"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#1E293B"}
          >
            ↻ REFRESH
          </button>

          {/* Version */}
          <span style={{ 
            color: "#475569", 
            fontSize: "10px",
            padding: "3px 8px",
            border: "1px solid #1E293B",
            borderRadius: "3px",
          }}>
            v1.0
          </span>
        </div>
      </div>
    </header>
  );
}
