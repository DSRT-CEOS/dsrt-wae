"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function CompanySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/companies?search=${encodeURIComponent(query)}&limit=8`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data || []);
          setOpen(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (ticker) => {
    setQuery("");
    setOpen(false);
    router.push(`/company/${ticker}`);
  };

  const formatCap = (usd) => {
    if (!usd) return "";
    if (usd >= 1e12) return `$${(usd / 1e12).toFixed(1)}T`;
    if (usd >= 1e9) return `$${(usd / 1e9).toFixed(0)}B`;
    return `$${(usd / 1e6).toFixed(0)}M`;
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: focused ? "#0F172A" : "#0a1120",
        border: `1px solid ${focused ? "#3B82F6" : "#1E293B"}`,
        borderRadius: "6px",
        padding: "6px 12px",
        transition: "all 0.15s",
      }}>
        <span style={{ color: "#64748B", marginRight: "8px", fontSize: "12px" }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); if (results.length > 0) setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder="Search companies (e.g. Reliance, Apple, TSMC)..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#E2E8F0",
            fontSize: "12px",
            fontFamily: "inherit",
            letterSpacing: "0.5px",
          }}
        />
        {loading && (
          <span style={{
            width: "12px", height: "12px",
            border: "2px solid #1E293B",
            borderTopColor: "#3B82F6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          backgroundColor: "#0a1120",
          border: "1px solid #1E293B",
          borderRadius: "6px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          zIndex: 1000,
          maxHeight: "400px",
          overflowY: "auto",
        }}>
          {results.map((c, i) => (
            <div
              key={c.ticker}
              onClick={() => handleSelect(c.ticker)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: i < results.length - 1 ? "1px solid #1E293B" : "none",
                transition: "background 0.1s",
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#111827"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#F1F5F9", letterSpacing: "1px" }}>
                    {c.ticker}
                  </span>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>{c.name}</span>
                </div>
                <span style={{ fontSize: "10px", color: "#60A5FA" }}>{formatCap(c.market_cap_usd)}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", fontSize: "9px", color: "#64748B", letterSpacing: "1px" }}>
                <span>{c.sector}</span>
                <span>·</span>
                <span>{c.country}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          backgroundColor: "#0a1120",
          border: "1px solid #1E293B",
          borderRadius: "6px",
          padding: "16px",
          textAlign: "center",
          color: "#64748B",
          fontSize: "11px",
          zIndex: 1000,
        }}>
          No companies found for "{query}"
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
