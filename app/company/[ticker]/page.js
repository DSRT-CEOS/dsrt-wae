"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CompanyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const ticker = params.ticker?.toUpperCase();

  const [company, setCompany] = useState(null);
  const [events, setEvents] = useState([]);
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/company/${ticker}`);
        const json = await res.json();
        if (json.success) {
          setCompany(json.data.company);
          setEvents(json.data.recent_events || []);
          setPeers(json.data.peers || []);
        } else {
          setError(json.error || "Company not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (ticker) load();
  }, [ticker]);

  const getHeatColor = (s) => {
    if (s >= 8) return "#FF3B3B";
    if (s >= 6) return "#FF8C42";
    if (s >= 4) return "#FCD34D";
    if (s >= 2) return "#60A5FA";
    return "#4ADE80";
  };

  const formatMarketCap = (usd) => {
    if (!usd) return "—";
    if (usd >= 1e12) return `$${(usd / 1e12).toFixed(2)}T`;
    if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`;
    if (usd >= 1e6) return `$${(usd / 1e6).toFixed(0)}M`;
    return `$${usd}`;
  };

  const formatNumber = (n) => {
    if (!n) return "—";
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return n.toLocaleString();
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  // Calculate aggregate metrics from linked events
  const metrics = {
    totalEvents: events.length,
    criticalEvents: events.filter(e => (e.impact_score || e.heat_score) >= 8).length,
    avgImpact: events.length > 0 
      ? (events.reduce((sum, e) => sum + (e.impact_score || e.heat_score || 0), 0) / events.length).toFixed(1)
      : "—",
    riskTrend: events.filter(e => (e.impact_score || 0) >= 7).length > 3 ? "RISING" : "STABLE",
  };

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>📊</div>
        <p>Loading company profile...</p>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div style={loadingStyle}>
        <p>{error || "Company not found"}</p>
        <button onClick={() => router.push("/")} style={btnStyle}>Back to Dashboard</button>
      </div>
    );
  }

  const riskColor = metrics.avgImpact >= 7 ? "#FF3B3B" : metrics.avgImpact >= 5 ? "#FF8C42" : "#4ADE80";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#030712", color: "#E2E8F0", fontFamily: "'Courier New', monospace" }}>

      {/* HEADER */}
      <header style={headerStyle}>
        <button onClick={() => router.push("/")} style={backBtn}>← BACK</button>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>🌍</span>
          <span style={{ letterSpacing: "2px", fontSize: "14px", fontWeight: "bold" }}>
            DSRT <span style={{ color: "#3B82F6" }}>WAE</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button style={btnSmall}>WATCHLIST</button>
          <button style={btnSmall}>ALERT</button>
          <button style={btnSmall}>EXPORT</button>
        </div>
      </header>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "30px 24px" }}>

        {/* COMPANY HERO */}
        <div style={{
          padding: "24px",
          backgroundColor: "#0a1120",
          border: "1px solid #1E293B",
          borderLeft: `4px solid ${riskColor}`,
          borderRadius: "0 8px 8px 0",
          marginBottom: "24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#64748B", marginBottom: "6px" }}>
                {company.exchange} · {company.country}
              </div>
              <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#F1F5F9", margin: "0 0 4px 0", letterSpacing: "1px" }}>
                {company.ticker}
              </h1>
              <p style={{ fontSize: "16px", color: "#94A3B8", margin: "0 0 12px 0" }}>
                {company.name}
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                <span style={tag}>{company.sector}</span>
                <span style={tag}>{company.industry}</span>
                {company.headquarters_city && (
                  <span style={tag}>📍 {company.headquarters_city}</span>
                )}
              </div>
              <p style={{ fontSize: "12px", color: "#CBD5E1", lineHeight: "1.6", margin: 0 }}>
                {company.description}
              </p>
            </div>

            <div style={{ minWidth: "240px" }}>
              <div style={statBox}>
                <div style={statLabel}>MARKET CAP</div>
                <div style={{ ...statValue, color: "#60A5FA" }}>
                  {formatMarketCap(company.market_cap_usd)}
                </div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>WAE RISK SCORE</div>
                <div style={{ ...statValue, color: riskColor }}>
                  {metrics.avgImpact}/10
                </div>
                <div style={{ fontSize: "9px", color: riskColor, letterSpacing: "1px", marginTop: "2px" }}>
                  {metrics.riskTrend}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KEY METRICS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
          <MetricCard label="EMPLOYEES" value={formatNumber(company.employees)} />
          <MetricCard label="FOUNDED" value={company.founded_year || "—"} />
          <MetricCard label="CEO" value={company.ceo || "—"} small />
          <MetricCard label="EVENTS TRACKED" value={metrics.totalEvents} accent="#60A5FA" />
          <MetricCard label="CRITICAL EVENTS" value={metrics.criticalEvents} accent="#FF3B3B" />
          <MetricCard label="AVG IMPACT" value={metrics.avgImpact} accent={riskColor} />
        </div>

        {/* TABS BAR (placeholder for future) */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #1E293B", paddingBottom: "0" }}>
          {["Overview", "Events", "Financials", "Network", "Predictions"].map((tab, i) => (
            <div key={tab} style={{
              padding: "10px 16px",
              fontSize: "11px",
              letterSpacing: "1.5px",
              color: i === 0 ? "#4ADE80" : "#475569",
              borderBottom: i === 0 ? "2px solid #4ADE80" : "2px solid transparent",
              cursor: "pointer",
              fontWeight: i === 0 ? "bold" : "normal",
            }}>
              {tab.toUpperCase()}
              {i > 1 && <span style={{ fontSize: "8px", marginLeft: "4px", color: "#334155" }}>V3</span>}
            </div>
          ))}
        </div>

        {/* RECENT EVENTS (Impact Timeline) */}
        <section style={sectionBox}>
          <div style={sectionHeader}>
            <span style={sectionDot}>●</span>
            <h2 style={sectionTitle}>IMPACT TIMELINE</h2>
            <span style={{ fontSize: "10px", color: "#64748B", marginLeft: "auto" }}>
              {events.length} events tracked
            </span>
          </div>
          
          {events.length === 0 ? (
            <div style={emptyBox}>
              <div style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.5 }}>📡</div>
              <div>No events tracked yet for this company</div>
              <div style={{ fontSize: "11px", marginTop: "6px", color: "#334155" }}>
                Events will appear as they are detected by the WAE engine
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {events.map((e) => {
                const impact = e.impact_score || e.heat_score || 0;
                const color = getHeatColor(impact);
                return (
                  <div
                    key={e.id}
                    onClick={() => router.push(`/event/${e.id}`)}
                    style={{
                      padding: "14px 16px",
                      backgroundColor: "rgba(10, 17, 32, 0.6)",
                      border: "1px solid #1E293B",
                      borderLeft: `3px solid ${color}`,
                      borderRadius: "0 6px 6px 0",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#111827";
                      e.currentTarget.style.transform = "translateX(3px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(10, 17, 32, 0.6)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "6px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14px", fontWeight: "bold", color }}>{impact}</span>
                        <span style={{ fontSize: "9px", color: "#64748B", letterSpacing: "1px", textTransform: "uppercase" }}>
                          {e.category?.replace(/_/g, " ")}
                        </span>
                        {e.impact_channels && e.impact_channels.length > 0 && (
                          <span style={{
                            fontSize: "9px",
                            padding: "1px 6px",
                            backgroundColor: "rgba(168, 85, 247, 0.15)",
                            color: "#C084FC",
                            borderRadius: "3px",
                            border: "1px solid rgba(168, 85, 247, 0.3)",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                          }}>
                            {e.impact_channels[0]?.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "10px", color: "#475569" }}>
                        {formatDate(e.published_at || e.ingested_at)}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: "13px", color: "#E2E8F0", margin: "0 0 6px 0", lineHeight: "1.4", fontWeight: "500" }}>
                      {e.title}
                    </p>
                    
                    {e.llm_reasoning && (
                      <div style={{
                        marginTop: "8px",
                        padding: "8px 10px",
                        fontSize: "11px",
                        color: "#94A3B8",
                        backgroundColor: "rgba(74, 222, 128, 0.05)",
                        borderLeft: "2px solid #4ADE80",
                        borderRadius: "0 4px 4px 0",
                        fontStyle: "italic",
                        lineHeight: "1.5",
                      }}>
                        💡 {e.llm_reasoning}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* PEER COMPARISON */}
        {peers.length > 0 && (
          <section style={sectionBox}>
            <div style={sectionHeader}>
              <span style={sectionDot}>●</span>
              <h2 style={sectionTitle}>SECTOR PEERS</h2>
              <span style={{ fontSize: "10px", color: "#64748B", marginLeft: "auto" }}>
                Same sector + country
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              {peers.map((p) => (
                <div
                  key={p.ticker}
                  onClick={() => router.push(`/company/${p.ticker}`)}
                  style={{
                    padding: "12px 14px",
                    backgroundColor: "rgba(10, 17, 32, 0.6)",
                    border: "1px solid #1E293B",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = "#3B82F6"}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = "#1E293B"}
                >
                  <div style={{ fontSize: "12px", fontWeight: "bold", color: "#F1F5F9", marginBottom: "2px" }}>
                    {p.ticker}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "4px", lineHeight: "1.3" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: "10px", color: "#60A5FA" }}>
                    {formatMarketCap(p.market_cap_usd)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* COMPANY DETAILS */}
        <section style={sectionBox}>
          <div style={sectionHeader}>
            <span style={sectionDot}>●</span>
            <h2 style={sectionTitle}>COMPANY DETAILS</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            <DetailRow label="Legal Name" value={company.legal_name || company.name} />
            <DetailRow label="Ticker" value={company.ticker} />
            <DetailRow label="Exchange" value={company.exchange} />
            <DetailRow label="ISIN" value={company.isin || "—"} />
            <DetailRow label="Sector" value={company.sector} />
            <DetailRow label="Industry" value={company.industry} />
            <DetailRow label="Country" value={company.country} />
            <DetailRow label="HQ" value={company.headquarters_city} />
            <DetailRow label="CEO" value={company.ceo} />
            <DetailRow label="Founded" value={company.founded_year} />
            <DetailRow label="Employees" value={formatNumber(company.employees)} />
            <DetailRow label="Market Cap" value={formatMarketCap(company.market_cap_usd)} />
          </div>
          
          {company.website && (
            <div style={{ marginTop: "16px" }}>
              <a href={company.website} target="_blank" rel="noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "11px", color: "#60A5FA", textDecoration: "none",
                padding: "8px 14px", border: "1px solid #1E40AF",
                borderRadius: "4px", letterSpacing: "1px",
              }}>
                VISIT WEBSITE →
              </a>
            </div>
          )}
        </section>

        {/* PLACEHOLDER SECTIONS for V3 */}
        <section style={sectionBox}>
          <div style={sectionHeader}>
            <span style={sectionDot}>●</span>
            <h2 style={sectionTitle}>REVENUE GEOGRAPHY</h2>
            <span style={badgeSoon}>V2.1</span>
          </div>
          <div style={emptyBox}>
            Revenue exposure by country coming in MOD-019
          </div>
        </section>

        <section style={sectionBox}>
          <div style={sectionHeader}>
            <span style={sectionDot}>●</span>
            <h2 style={sectionTitle}>SUPPLY CHAIN NETWORK</h2>
            <span style={badgeSoon}>V5</span>
          </div>
          <div style={emptyBox}>
            Interactive supply chain graph coming in MOD-051
          </div>
        </section>

      </main>

      <footer style={{
        borderTop: "1px solid #1E293B", padding: "24px",
        textAlign: "center", color: "#334155", fontSize: "10px",
        marginTop: "40px", letterSpacing: "1px",
      }}>
        DSRT WAE | Company Intelligence | {company.ticker} | {company.exchange}
      </footer>
    </div>
  );
}

function MetricCard({ label, value, accent, small }) {
  return (
    <div style={statBox}>
      <div style={statLabel}>{label}</div>
      <div style={{
        ...statValue,
        color: accent || "#E2E8F0",
        fontSize: small ? "14px" : "20px",
      }}>{value}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "8px 12px", backgroundColor: "rgba(15, 23, 42, 0.5)",
      borderRadius: "4px", fontSize: "11px",
    }}>
      <span style={{ color: "#64748B", letterSpacing: "1px" }}>{label}</span>
      <span style={{ color: "#E2E8F0", fontWeight: "500" }}>{value || "—"}</span>
    </div>
  );
}

const loadingStyle = { minHeight: "100vh", backgroundColor: "#030712", color: "#E2E8F0", padding: "40px", textAlign: "center", fontFamily: "'Courier New', monospace", paddingTop: "120px" };
const btnStyle = { marginTop: "20px", padding: "10px 20px", backgroundColor: "#3B82F6", border: "none", color: "white", borderRadius: "6px", cursor: "pointer" };
const headerStyle = { position: "sticky", top: 0, backgroundColor: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid #1E293B", padding: "12px 24px", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between" };
const backBtn = { background: "transparent", border: "1px solid #334155", color: "#94A3B8", padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "inherit", letterSpacing: "1px" };
const btnSmall = { padding: "5px 10px", backgroundColor: "#0F172A", border: "1px solid #334155", color: "#94A3B8", borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontFamily: "inherit", letterSpacing: "1px" };
const sectionBox = { marginBottom: "20px", padding: "20px 22px", backgroundColor: "#0a1120", border: "1px solid #1E293B", borderRadius: "8px" };
const sectionHeader = { display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #1E293B" };
const sectionDot = { color: "#4ADE80", fontSize: "10px" };
const sectionTitle = { fontSize: "11px", letterSpacing: "3px", color: "#4ADE80", margin: 0, fontWeight: "bold" };
const tag = { display: "inline-block", padding: "3px 10px", fontSize: "10px", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#60A5FA", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "3px", letterSpacing: "1px" };
const statBox = { padding: "12px 14px", backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid #1E293B", borderRadius: "6px", marginBottom: "8px" };
const statLabel = { fontSize: "9px", letterSpacing: "2px", color: "#64748B", marginBottom: "4px" };
const statValue = { fontSize: "20px", fontWeight: "bold", color: "#F1F5F9" };
const emptyBox = { padding: "30px 20px", textAlign: "center", color: "#475569", fontSize: "13px", border: "1px dashed #1E293B", borderRadius: "6px" };
const badgeSoon = { marginLeft: "auto", fontSize: "9px", padding: "2px 8px", backgroundColor: "rgba(100, 116, 139, 0.15)", color: "#64748B", borderRadius: "3px", border: "1px solid rgba(100, 116, 139, 0.3)", letterSpacing: "1px", fontWeight: "bold" };
