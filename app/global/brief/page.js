"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BriefPage() {
  const router = useRouter();
  const [brief, setBrief] = useState(null);
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/global/brief");
        const json = await res.json();
        if (json.success) {
          setBrief(json.data.brief);
          setArchive(json.data.archive || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getHeatColor = (h) => {
    const v = parseFloat(h) || 0;
    if (v >= 8) return "#EF4444";
    if (v >= 6) return "#F59E0B";
    if (v >= 4) return "#FBBF24";
    if (v >= 2) return "#60A5FA";
    return "#4ADE80";
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0a0e1a", color: "#9CA3AF", padding: "100px 20px", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>
        Loading today's brief...
      </div>
    );
  }

  if (!brief) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0a0e1a", color: "#9CA3AF", padding: "100px 20px", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: "32px", marginBottom: "16px" }}>📊</div>
        <p>No brief available yet today</p>
        <p style={{ fontSize: "13px", color: "#6B7280" }}>Today's brief publishes at 7 AM IST</p>
        <button onClick={() => router.push("/global")} style={{ marginTop: "20px", padding: "10px 20px", backgroundColor: "#3B82F6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          ← Back to DSRT Global
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0e1a", color: "#E8EAED", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* NAV */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        backgroundColor: "rgba(10, 14, 26, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1F2937",
        padding: "16px 24px",
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.push("/global")}>
            <span style={{ fontSize: "24px" }}>🌐</span>
            <div style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "1px", color: "#FFFFFF" }}>
              DSRT <span style={{ color: "#3B82F6" }}>GLOBAL</span>
            </div>
          </div>
          <nav style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
            <a href="/global" style={{ color: "#D1D5DB", textDecoration: "none", fontWeight: "500" }}>← Articles</a>
            <a href="/" style={{ color: "#3B82F6", textDecoration: "none", fontWeight: "500" }}>DSRT WAE ↗</a>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 24px" }}>
        
        {/* Hero */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontSize: "12px", letterSpacing: "2px", color: "#3B82F6", marginBottom: "8px", fontWeight: "700", textTransform: "uppercase" }}>
            📊 The DSRT Brief
          </div>
          <h1 style={{ fontSize: "40px", fontWeight: "800", color: "#FFFFFF", marginBottom: "8px", lineHeight: "1.15" }}>
            {new Date(brief.brief_date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </h1>
          
          <div style={{ display: "flex", alignItems: "center", gap: "24px", padding: "20px", backgroundColor: "#111827", borderRadius: "10px", marginTop: "20px", border: "1px solid #1F2937" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Global Heat Index</div>
              <div style={{ fontSize: "36px", fontWeight: "800", color: getHeatColor(brief.global_heat_index), lineHeight: 1 }}>
                {brief.global_heat_index}
              </div>
            </div>
            <div style={{ width: "1px", height: "60px", backgroundColor: "#1F2937" }} />
            <div>
              <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Threat Level</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: getHeatColor(brief.global_heat_index) }}>
                {brief.threat_level}
              </div>
            </div>
            {brief.heat_change !== 0 && (
              <>
                <div style={{ width: "1px", height: "60px", backgroundColor: "#1F2937" }} />
                <div>
                  <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>vs Yesterday</div>
                  <div style={{ fontSize: "22px", fontWeight: "700", color: brief.heat_change > 0 ? "#EF4444" : "#4ADE80" }}>
                    {brief.heat_change > 0 ? "↑" : "↓"} {Math.abs(brief.heat_change)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 5 Things */}
        <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#FFFFFF", marginBottom: "20px" }}>
          Five things you need to know
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "40px" }}>
          {(brief.headlines || []).map((item, i) => (
            <div key={i} style={{
              padding: "24px",
              backgroundColor: "#111827",
              border: "1px solid #1F2937",
              borderRadius: "10px",
              display: "flex",
              gap: "20px",
            }}>
              <div style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "#3B82F6",
                lineHeight: 1,
                minWidth: "40px",
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#FFFFFF", marginBottom: "8px", lineHeight: "1.3" }}>
                  {item.headline}
                </h3>
                <p style={{ fontSize: "14px", color: "#D1D5DB", lineHeight: "1.6", marginBottom: "12px" }}>
                  {item.summary}
                </p>
                {item.why_it_matters && (
                  <div style={{ 
                    padding: "12px 16px", 
                    backgroundColor: "rgba(59, 130, 246, 0.08)",
                    borderLeft: "3px solid #3B82F6",
                    borderRadius: "0 6px 6px 0",
                    fontSize: "13px",
                    color: "#D1D5DB",
                    lineHeight: "1.5",
                  }}>
                    <strong style={{ color: "#60A5FA" }}>Why it matters:</strong> {item.why_it_matters}
                  </div>
                )}
                <div style={{ marginTop: "12px", fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {item.category} · {item.region}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Watch Today */}
        {brief.watch_today && brief.watch_today.length > 0 && (
          <>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#FFFFFF", marginBottom: "20px" }}>
              👁 Watch today
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
              {brief.watch_today.map((item, i) => (
                <div key={i} style={{ padding: "16px 20px", backgroundColor: "#111827", borderLeft: "3px solid #F59E0B", borderRadius: "0 8px 8px 0" }}>
                  <div style={{ fontSize: "12px", color: "#F59E0B", fontWeight: "600", marginBottom: "4px" }}>{item.time}</div>
                  <div style={{ fontSize: "15px", color: "#FFFFFF", fontWeight: "500", marginBottom: "4px" }}>{item.event}</div>
                  <div style={{ fontSize: "13px", color: "#9CA3AF" }}>{item.importance}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Regional Heat */}
        {brief.regional_heat && Object.keys(brief.regional_heat).length > 0 && (
          <>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#FFFFFF", marginBottom: "20px" }}>
              🌍 Regional heat breakdown
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "40px" }}>
              {Object.entries(brief.regional_heat)
                .sort(([,a], [,b]) => b - a)
                .map(([region, heat]) => (
                <div key={region} style={{
                  padding: "16px",
                  backgroundColor: "#111827",
                  border: "1px solid #1F2937",
                  borderRadius: "8px",
                }}>
                  <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "6px" }}>{region}</div>
                  <div style={{ fontSize: "24px", fontWeight: "800", color: getHeatColor(heat) }}>{heat}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Archive */}
        {archive.length > 1 && (
          <div style={{ borderTop: "1px solid #1F2937", paddingTop: "32px", marginTop: "40px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#FFFFFF", marginBottom: "16px" }}>Recent briefs</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {archive.slice(1).map(b => (
                <a 
                  key={b.brief_date}
                  href={`/global/brief?date=${b.brief_date}`}
                  style={{ 
                    padding: "12px 16px", 
                    backgroundColor: "#111827", 
                    borderRadius: "6px", 
                    textDecoration: "none",
                    color: "#D1D5DB",
                    fontSize: "13px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{new Date(b.brief_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                  <span style={{ color: getHeatColor(b.global_heat_index), fontWeight: "600" }}>
                    {b.global_heat_index} · {b.threat_level}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* AI Disclosure */}
        <div style={{
          marginTop: "48px",
          padding: "20px",
          backgroundColor: "#111827",
          border: "1px solid #1F2937",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#6B7280",
          textAlign: "center",
        }}>
          The DSRT Brief is generated daily at 7 AM IST by DSRT WAE's AI engine, analyzing intelligence from 18+ sources worldwide. <a href="/" style={{ color: "#3B82F6", textDecoration: "none" }}>How it works →</a>
        </div>

      </main>

      <footer style={{ borderTop: "1px solid #1F2937", padding: "32px 24px", backgroundColor: "#0F1623", marginTop: "48px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", textAlign: "center", color: "#6B7280", fontSize: "12px" }}>
          DSRT GLOBAL · Powered by DSRT WAE
        </div>
      </footer>
    </div>
  );
}
