"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeadlineTicker from "../components/HeadlineTicker";
import RealWorldMap from "../components/RealWorldMap";
import WorldIndices from "../components/WorldIndices";
import HeatGauge from "../components/HeatGauge";
import HeatTrendChart from "../components/HeatTrendChart";
import CategoryActivity from "../components/CategoryActivity";
import TopCompanies from "../components/TopCompanies";

export default function WorldPulsePage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sRes, bRes] = await Promise.all([
          fetch("/api/global/stats"),
          fetch("/api/global/brief"),
        ]);
        const sJson = await sRes.json();
        const bJson = await bRes.json();
        if (sJson.success) setStats(sJson.data);
        if (bJson.success) setBrief(bJson.data.brief);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0e1a", color: "#E8EAED", fontFamily: "'Inter', sans-serif" }}>

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
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "1px", color: "#FFFFFF" }}>
                DSRT <span style={{ color: "#3B82F6" }}>GLOBAL</span>
              </div>
              <div style={{ fontSize: "10px", color: "#6B7280", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                World Pulse
              </div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
            <a href="/global" style={navLink}>← News</a>
            <a href="/global/brief" style={navLink}>The Brief</a>
            <a href="/global/pulse" style={{ ...navLink, color: "#3B82F6", fontWeight: "700" }}>🌍 World Pulse</a>
            <a href="/" style={{ ...navLink, color: "#3B82F6", padding: "6px 12px", border: "1px solid #3B82F6", borderRadius: "4px" }}>↗ Terminal</a>
          </nav>
        </div>
      </header>

      <HeadlineTicker bucket="geopolitics" direction="left" label="GEOPOLITICS · DEFENSE" accentColor="#C084FC" speed={120} />

      {/* PAGE HEADER */}
      <section style={{
        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(168, 85, 247, 0.05))",
        borderBottom: "1px solid #1F2937",
        padding: "32px 24px",
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "12px", letterSpacing: "2px", color: "#3B82F6", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase" }}>
              🌍 World Pulse
            </div>
            <h1 style={{ fontSize: "36px", fontWeight: "800", color: "#FFFFFF", margin: 0, lineHeight: "1.1" }}>
              The state of the world, visualized
            </h1>
            <p style={{ fontSize: "14px", color: "#9CA3AF", marginTop: "8px", lineHeight: "1.6", maxWidth: "640px" }}>
              Live intelligence from DSRT WAE engine. Real-time maps, charts, and indices across geopolitics, markets, tech, climate, and diplomacy.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", backgroundColor: "rgba(74, 222, 128, 0.1)", border: "1px solid rgba(74, 222, 128, 0.3)", borderRadius: "20px", fontSize: "11px", color: "#4ADE80", fontWeight: "700", letterSpacing: "1px" }}>
            ● LIVE · AUTO-REFRESH 60s
          </div>
        </div>
      </section>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        
        {loading ? (
          <div style={{ padding: "80px 20px", textAlign: "center", color: "#6B7280" }}>
            Loading pulse...
          </div>
        ) : (
          <>
            {/* ROW 1: REAL WORLD MAP (LEFT, larger) + HEAT GAUGE (RIGHT) */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px", marginBottom: "20px" }} className="pulse-row">
              
              <div style={cardLarge}>
                <SectionTitle title="LIVE GLOBAL EVENT MAP" icon="🌍" subtitle="Hover any country to see active events" />
                <div style={{ marginTop: "16px" }}>
                  <RealWorldMap events={stats?.map_events || []} height={420} />
                </div>
              </div>
              
              <div style={cardLarge}>
                <SectionTitle title="GLOBAL DSRT HEAT" icon="⚡" />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, padding: "20px 0" }}>
                  <HeatGauge value={stats?.current_heat?.index || 0} label="" size={200} />
                </div>
                {stats?.current_heat?.change !== 0 && (
                  <div style={{ textAlign: "center", fontSize: "13px", color: stats?.current_heat?.change > 0 ? "#EF4444" : "#4ADE80", fontWeight: "600" }}>
                    {stats?.current_heat?.change > 0 ? "↑" : "↓"} {Math.abs(stats?.current_heat?.change || 0)} from yesterday
                  </div>
                )}
              </div>
            </div>

            {/* ROW 2: NEW SPECIALIZED INDICES (full width) */}
            <div style={{ ...cardLarge, marginBottom: "20px" }}>
              <SectionTitle title="WORLD INDICES" icon="📊" subtitle="Domain-specific intelligence scores" />
              <div style={{ marginTop: "16px" }}>
                <WorldIndices events={stats?.map_events || []} categoryActivity={stats?.category_activity || {}} />
              </div>
            </div>

            {/* ROW 3: 7-DAY TREND + CATEGORY ACTIVITY */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }} className="pulse-row">
              <div style={cardLarge}>
                <SectionTitle title="7-DAY HEAT TREND" icon="📈" />
                <div style={{ flex: 1, display: "flex", alignItems: "center", marginTop: "16px" }}>
                  <HeatTrendChart data={stats?.heat_trend_7d || []} height={180} />
                </div>
              </div>
              
              <div style={cardLarge}>
                <SectionTitle title="CATEGORY ACTIVITY" icon="📊" subtitle="Event volume by category (24h)" />
                <div style={{ marginTop: "16px" }}>
                  <CategoryActivity data={stats?.category_activity || {}} />
                </div>
              </div>
            </div>

            {/* ROW 4: TOP COMPANIES + WATCH */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }} className="pulse-row">
              <div style={cardLarge}>
                <SectionTitle title="MOST AFFECTED COMPANIES" icon="🎯" subtitle="Highest impact scores (24h)" />
                <div style={{ marginTop: "16px" }}>
                  <TopCompanies companies={stats?.top_affected_companies || []} />
                </div>
              </div>

              <div style={cardLarge}>
                <SectionTitle title="TODAY'S WATCH" icon="👁" subtitle="Key events to monitor" />
                <div style={{ marginTop: "16px" }}>
                  {brief?.watch_today && brief.watch_today.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {brief.watch_today.slice(0, 5).map((item, i) => (
                        <div key={i} style={{ padding: "12px 14px", backgroundColor: "#0a0e1a", borderLeft: "3px solid #F59E0B", borderRadius: "0 6px 6px 0" }}>
                          <div style={{ fontSize: "11px", color: "#F59E0B", fontWeight: "700", marginBottom: "4px" }}>{item.time}</div>
                          <div style={{ fontSize: "13px", color: "#FFFFFF", fontWeight: "500", marginBottom: "4px" }}>{item.event}</div>
                          <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{item.importance}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: "20px", textAlign: "center", color: "#6B7280", fontSize: "12px" }}>No watch items today</div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 5: CTAs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="pulse-row">
              <div onClick={() => router.push("/global")} style={ctaCard}>
                <div style={{ fontSize: "24px", marginBottom: "12px" }}>📰</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF", marginBottom: "6px" }}>Read Articles</div>
                <div style={{ fontSize: "12px", color: "#9CA3AF" }}>Latest analysis from DSRT Global</div>
              </div>
              <div onClick={() => router.push("/global/brief")} style={ctaCard}>
                <div style={{ fontSize: "24px", marginBottom: "12px" }}>📊</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF", marginBottom: "6px" }}>Today's Brief</div>
                <div style={{ fontSize: "12px", color: "#9CA3AF" }}>5 things you need to know</div>
              </div>
            </div>
          </>
        )}
      </main>

      <footer style={{ borderTop: "1px solid #1F2937", padding: "32px 24px", marginTop: "64px", backgroundColor: "#0F1623" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", fontSize: "12px", color: "#6B7280" }}>
          <div><strong style={{ color: "#D1D5DB" }}>DSRT GLOBAL · WORLD PULSE</strong> · Powered by DSRT WAE</div>
          <div style={{ display: "flex", gap: "20px" }}>
            <a href="/global" style={{ color: "#6B7280", textDecoration: "none" }}>News</a>
            <a href="/global/brief" style={{ color: "#6B7280", textDecoration: "none" }}>Brief</a>
            <a href="/" style={{ color: "#3B82F6", textDecoration: "none" }}>WAE Terminal →</a>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .pulse-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function SectionTitle({ title, icon, subtitle }) {
  return (
    <div style={{ borderBottom: "1px solid #1F2937", paddingBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
        <span style={{ fontSize: "12px", letterSpacing: "2px", color: "#FFFFFF", fontWeight: "700", textTransform: "uppercase" }}>{title}</span>
      </div>
      {subtitle && <div style={{ fontSize: "11px", color: "#6B7280", marginLeft: "26px" }}>{subtitle}</div>}
    </div>
  );
}

const navLink = { color: "#D1D5DB", textDecoration: "none", fontSize: "13px", fontWeight: "500" };
const cardLarge = { padding: "20px", backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "12px", display: "flex", flexDirection: "column" };
const ctaCard = { padding: "32px", backgroundColor: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "12px", cursor: "pointer", textAlign: "center" };
