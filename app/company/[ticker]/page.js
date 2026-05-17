"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PriceChart from "../../components/PriceChart";

export default function CompanyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const ticker = params.ticker?.toUpperCase();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load(skipRefresh = false) {
      try {
        if (!skipRefresh) {
          // Fire and forget: trigger refresh in background
          fetch(`/api/company/${ticker}/refresh`, { method: "POST" }).catch(() => {});
        }
        const res = await fetch(`/api/company/${ticker}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (ticker) {
      load();
      // Auto-refresh price every 30 seconds
      const interval = setInterval(() => {
        load(false);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [ticker]);

  const fmt = {
    money: (n, currency = "USD") => {
      if (n == null) return "—";
      const symbol = currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
      if (Math.abs(n) >= 1e12) return `${symbol}${(n / 1e12).toFixed(2)}T`;
      if (Math.abs(n) >= 1e9) return `${symbol}${(n / 1e9).toFixed(2)}B`;
      if (Math.abs(n) >= 1e6) return `${symbol}${(n / 1e6).toFixed(2)}M`;
      if (Math.abs(n) >= 1e3) return `${symbol}${(n / 1e3).toFixed(2)}K`;
      return `${symbol}${n.toFixed(2)}`;
    },
    num: (n, dec = 2) => n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: dec }),
    pct: (n, dec = 2) => n == null ? "—" : `${n.toFixed(dec)}%`,
    pctMult: (n, dec = 2) => n == null ? "—" : `${(n * 100).toFixed(dec)}%`,
    ratio: (n) => n == null ? "—" : n.toFixed(2),
    timeAgo: (date) => {
      if (!date) return "never";
      const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return mins + "m ago";
      if (mins < 1440) return Math.floor(mins / 60) + "h ago";
      return Math.floor(mins / 1440) + "d ago";
    },
  };

  const getHeatColor = (s) => {
    if (s >= 8) return "#FF3B3B";
    if (s >= 6) return "#FF8C42";
    if (s >= 4) return "#FCD34D";
    if (s >= 2) return "#60A5FA";
    return "#4ADE80";
  };

  if (loading) {
    return <div style={loadingStyle}><div style={{ fontSize: "40px", marginBottom: "16px" }}>📊</div><p>Loading company intelligence...</p></div>;
  }

  if (error || !data) {
    return (
      <div style={loadingStyle}>
        <p>{error || "Company not found"}</p>
        <button onClick={() => router.push("/")} style={btnStyle}>Back</button>
      </div>
    );
  }

  const { company, price, financials, ownership, ratings, recent_events, peers, relationships } = data;
  const currency = price?.currency || (company.exchange === "NSE" || company.exchange === "BSE" ? "INR" : "USD");
  
  const changeColor = (price?.change_percent || 0) >= 0 ? "#4ADE80" : "#FF3B3B";
  const changeIcon = (price?.change_percent || 0) >= 0 ? "▲" : "▼";
  
  // WAE risk score from events
  const avgImpact = recent_events.length > 0 
    ? recent_events.reduce((s, e) => s + (e.impact_score || 0), 0) / recent_events.length
    : null;
  const riskColor = avgImpact ? getHeatColor(avgImpact) : "#64748B";
  
  // Recommendation badge
  const recColors = {
    STRONG_BUY: "#22C55E",
    BUY: "#4ADE80",
    HOLD: "#FCD34D",
    SELL: "#FF8C42",
    STRONG_SELL: "#FF3B3B",
  };
  const recColor = ratings?.consensus_rating ? recColors[ratings.consensus_rating] : "#64748B";

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
          <button style={btnSmall}>+ WATCHLIST</button>
          <button style={btnSmall}>🔔 ALERT</button>
          <button style={btnSmall}>📥 EXPORT</button>
        </div>
      </header>

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>

        {/* HERO — Company Header */}
        <div style={{
          padding: "24px",
          backgroundColor: "#0a1120",
          border: "1px solid #1E293B",
          borderLeft: `4px solid ${riskColor}`,
          borderRadius: "0 8px 8px 0",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "30px", flexWrap: "wrap" }}>
            
            {/* LEFT — Identity */}
            <div style={{ flex: 1, minWidth: "300px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#64748B", marginBottom: "6px" }}>
                {company.exchange} · {company.country}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "8px" }}>
                <h1 style={{ fontSize: "36px", fontWeight: "bold", color: "#F1F5F9", margin: 0, letterSpacing: "1px" }}>
                  {company.ticker}
                </h1>
                {price?.price && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "26px", fontWeight: "bold", color: "#F1F5F9" }}>
                      {fmt.money(price.price, currency).replace(/[A-Z]/g, "")}
                    </span>
                    <span style={{ fontSize: "14px", color: changeColor, fontWeight: "bold" }}>
                      {changeIcon} {fmt.pct(Math.abs(price.change_percent), 2)}
                    </span>
                    <span style={{ fontSize: "12px", color: changeColor }}>
                      ({fmt.money(price.change_amount, currency)})
                    </span>
                    {price?.fetched_at && (
                      <span style={{ 
                        fontSize: "10px", 
                        color: "#64748B",
                        padding: "2px 8px",
                        backgroundColor: "rgba(74, 222, 128, 0.1)",
                        border: "1px solid rgba(74, 222, 128, 0.3)",
                        borderRadius: "3px",
                        letterSpacing: "1px"
                      }}>
                        ● LIVE · {fmt.timeAgo(price.fetched_at)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p style={{ fontSize: "15px", color: "#94A3B8", margin: "0 0 12px 0" }}>
                {company.name}
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                <span style={tag}>{company.sector}</span>
                <span style={tag}>{company.industry}</span>
                {company.headquarters_city && <span style={tag}>📍 {company.headquarters_city}</span>}
                {ratings?.consensus_rating && (
                  <span style={{ ...tag, backgroundColor: `${recColor}20`, color: recColor, borderColor: `${recColor}50`, fontWeight: "bold" }}>
                    📊 {ratings.consensus_rating.replace("_", " ")}
                  </span>
                )}
              </div>
              <p style={{ fontSize: "12px", color: "#CBD5E1", lineHeight: "1.6", margin: 0 }}>
                {company.description}
              </p>
            </div>

            {/* RIGHT — Top Stats */}
            <div style={{ minWidth: "280px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <StatBox label="MARKET CAP" value={fmt.money(price?.market_cap_usd || company.market_cap_usd, "USD")} color="#60A5FA" />
                <StatBox label="WAE RISK" value={avgImpact ? `${avgImpact.toFixed(1)}/10` : "—"} color={riskColor} />
                <StatBox label="P/E RATIO" value={fmt.ratio(price?.pe_ratio || financials?.pe_ratio)} />
                <StatBox label="DIV YIELD" value={fmt.pctMult(price?.dividend_yield)} />
                {ratings?.target_price_avg && (
                  <>
                    <StatBox label="ANALYST TARGET" value={fmt.money(ratings.target_price_avg, currency).replace(/[A-Z]/g, "")} color="#C084FC" />
                    <StatBox label="UPSIDE" value={fmt.pct(ratings.upside_percent, 1)} color={ratings.upside_percent > 0 ? "#4ADE80" : "#FF3B3B"} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={tabsBar}>
          {[
            { id: "overview", label: "OVERVIEW" },
            { id: "financials", label: "FINANCIALS" },
            { id: "events", label: `EVENTS (${recent_events.length})` },
            { id: "ownership", label: "OWNERSHIP" },
            { id: "analysts", label: "ANALYSTS" },
            { id: "network", label: "NETWORK" },
            { id: "details", label: "DETAILS" },
          ].map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...tabStyle,
                color: activeTab === tab.id ? "#4ADE80" : "#475569",
                borderBottom: activeTab === tab.id ? "2px solid #4ADE80" : "2px solid transparent",
                fontWeight: activeTab === tab.id ? "bold" : "normal",
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* TAB CONTENT */}
        {activeTab === "overview" && (
          <OverviewTab company={company} price={price} financials={financials} ratings={ratings} fmt={fmt} currency={currency} />
        )}
        
        {activeTab === "financials" && (
          <FinancialsTab financials={financials} fmt={fmt} currency={currency} />
        )}
        
        {activeTab === "events" && (
          <EventsTab events={recent_events} fmt={fmt} getHeatColor={getHeatColor} router={router} />
        )}
        
        {activeTab === "ownership" && (
          <OwnershipTab ownership={ownership} company={company} fmt={fmt} />
        )}
        
        {activeTab === "analysts" && (
          <AnalystsTab ratings={ratings} fmt={fmt} currency={currency} />
        )}
        
        {activeTab === "network" && (
          <NetworkTab relationships={relationships} peers={peers} router={router} fmt={fmt} />
        )}
        
        {activeTab === "details" && (
          <DetailsTab company={company} price={price} fmt={fmt} />
        )}

      </main>

      <footer style={{
        borderTop: "1px solid #1E293B", padding: "20px",
        textAlign: "center", color: "#334155", fontSize: "10px",
        marginTop: "40px", letterSpacing: "1px",
      }}>
        DSRT WAE | {company.ticker} | {company.exchange} | Data: Yahoo Finance, WAE Events Engine
      </footer>
    </div>
  );
}

// ============================================
// TAB COMPONENTS
// ============================================

function OverviewTab({ company, price, financials, ratings, fmt, currency }) {
  return (
    <div>
      {/* PRICE CHART */}
      <section style={section}>
        <h2 style={sectionTitle}>● PRICE CHART</h2>
        <PriceChart ticker={company.ticker} currency={currency} />
      </section>

      {/* KEY METRICS GRID */}
      <section style={section}>
        <h2 style={sectionTitle}>● KEY METRICS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
          <MetricCard label="OPEN" value={fmt.money(price?.open_price, currency)} />
          <MetricCard label="DAY HIGH" value={fmt.money(price?.high_price, currency)} color="#4ADE80" />
          <MetricCard label="DAY LOW" value={fmt.money(price?.low_price, currency)} color="#FF8C42" />
          <MetricCard label="PREV CLOSE" value={fmt.money(price?.prev_close, currency)} />
          <MetricCard label="VOLUME" value={fmt.num(price?.volume, 0)} />
          <MetricCard label="52W HIGH" value={fmt.money(price?.week_52_high, currency)} color="#4ADE80" />
          <MetricCard label="52W LOW" value={fmt.money(price?.week_52_low, currency)} color="#FF8C42" />
          <MetricCard label="BETA" value={fmt.ratio(financials?.beta)} />
        </div>
      </section>

      {/* VALUATION */}
      <section style={section}>
        <h2 style={sectionTitle}>● VALUATION</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
          <MetricCard label="P/E TRAILING" value={fmt.ratio(financials?.pe_ratio || price?.pe_ratio)} />
          <MetricCard label="P/B RATIO" value={fmt.ratio(financials?.pb_ratio)} />
          <MetricCard label="P/S RATIO" value={fmt.ratio(financials?.ps_ratio)} />
          <MetricCard label="EV/EBITDA" value={fmt.ratio(financials?.ev_ebitda)} />
          <MetricCard label="EPS (TTM)" value={fmt.money(price?.eps, currency).replace(/[A-Z]/g, "")} />
          <MetricCard label="DIV YIELD" value={fmt.pctMult(price?.dividend_yield)} color="#4ADE80" />
        </div>
      </section>

      {/* PROFITABILITY */}
      <section style={section}>
        <h2 style={sectionTitle}>● PROFITABILITY</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
          <MetricCard label="GROSS MARGIN" value={fmt.pctMult(financials?.gross_margin)} color="#4ADE80" />
          <MetricCard label="OPERATING MARGIN" value={fmt.pctMult(financials?.operating_margin)} />
          <MetricCard label="NET MARGIN" value={fmt.pctMult(financials?.net_margin)} />
          <MetricCard label="ROE" value={fmt.pctMult(financials?.roe)} color="#60A5FA" />
        </div>
      </section>

      {/* BALANCE SHEET */}
      <section style={section}>
        <h2 style={sectionTitle}>● BALANCE SHEET</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
          <MetricCard label="CASH" value={fmt.money(financials?.cash_and_equivalents, currency)} color="#4ADE80" />
          <MetricCard label="TOTAL DEBT" value={fmt.money(financials?.total_debt, currency)} color="#FF8C42" />
          <MetricCard label="DEBT/EQUITY" value={fmt.ratio(financials?.debt_to_equity)} />
          <MetricCard label="CURRENT RATIO" value={fmt.ratio(financials?.current_ratio)} />
          <MetricCard label="FREE CASH FLOW" value={fmt.money(financials?.free_cash_flow, currency)} color="#4ADE80" />
          <MetricCard label="OPERATING CF" value={fmt.money(financials?.operating_cash_flow, currency)} />
        </div>
      </section>
    </div>
  );
}

function FinancialsTab({ financials, fmt, currency }) {
  if (!financials) {
    return <div style={emptyBox}>No financial data available. Sync this company to load Yahoo Finance data.</div>;
  }
  return (
    <div>
      <section style={section}>
        <h2 style={sectionTitle}>● INCOME STATEMENT (TTM)</h2>
        <FinRow label="Revenue" value={fmt.money(financials.revenue, currency)} />
        <FinRow label="Gross Profit" value={fmt.money(financials.gross_profit, currency)} />
        <FinRow label="Operating Income" value={fmt.money(financials.operating_income, currency)} />
        <FinRow label="EBITDA" value={fmt.money(financials.ebitda, currency)} />
        <FinRow label="Net Income" value={fmt.money(financials.net_income, currency)} />
        <FinRow label="EPS (Diluted)" value={fmt.money(financials.eps_diluted, currency).replace(/[A-Z]/g, "")} />
      </section>
      <section style={section}>
        <h2 style={sectionTitle}>● PROFITABILITY MARGINS</h2>
        <FinRow label="Gross Margin" value={fmt.pctMult(financials.gross_margin)} />
        <FinRow label="Operating Margin" value={fmt.pctMult(financials.operating_margin)} />
        <FinRow label="Net Margin" value={fmt.pctMult(financials.net_margin)} />
        <FinRow label="ROE" value={fmt.pctMult(financials.roe)} />
        <FinRow label="ROCE" value={fmt.pctMult(financials.roce)} />
      </section>
      <section style={section}>
        <h2 style={sectionTitle}>● VALUATION RATIOS</h2>
        <FinRow label="P/E Ratio" value={fmt.ratio(financials.pe_ratio)} />
        <FinRow label="P/B Ratio" value={fmt.ratio(financials.pb_ratio)} />
        <FinRow label="P/S Ratio" value={fmt.ratio(financials.ps_ratio)} />
        <FinRow label="EV/EBITDA" value={fmt.ratio(financials.ev_ebitda)} />
      </section>
      <section style={section}>
        <h2 style={sectionTitle}>● BALANCE SHEET</h2>
        <FinRow label="Cash & Equivalents" value={fmt.money(financials.cash_and_equivalents, currency)} />
        <FinRow label="Total Debt" value={fmt.money(financials.total_debt, currency)} />
        <FinRow label="Debt/Equity" value={fmt.ratio(financials.debt_to_equity)} />
        <FinRow label="Current Ratio" value={fmt.ratio(financials.current_ratio)} />
      </section>
      <section style={section}>
        <h2 style={sectionTitle}>● CASH FLOW</h2>
        <FinRow label="Operating Cash Flow" value={fmt.money(financials.operating_cash_flow, currency)} />
        <FinRow label="Free Cash Flow" value={fmt.money(financials.free_cash_flow, currency)} />
        <FinRow label="CapEx" value={fmt.money(financials.capex, currency)} />
      </section>
    </div>
  );
}

function EventsTab({ events, fmt, getHeatColor, router }) {
  if (events.length === 0) {
    return <div style={emptyBox}>No events tracked yet for this company</div>;
  }
  return (
    <section style={section}>
      <h2 style={sectionTitle}>● IMPACT TIMELINE ({events.length} events)</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {events.map(e => {
          const impact = e.impact_score || e.heat_score || 0;
          const color = getHeatColor(impact);
          return (
            <div key={e.id} onClick={() => router.push(`/event/${e.id}`)}
              style={{ padding: "14px 16px", backgroundColor: "rgba(10, 17, 32, 0.6)", border: "1px solid #1E293B", borderLeft: `3px solid ${color}`, borderRadius: "0 6px 6px 0", cursor: "pointer", transition: "all 0.15s" }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#111827"; e.currentTarget.style.transform = "translateX(3px)"; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "rgba(10, 17, 32, 0.6)"; e.currentTarget.style.transform = "translateX(0)"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: "bold", color }}>{impact}</span>
                  <span style={{ fontSize: "9px", color: "#64748B", letterSpacing: "1px", textTransform: "uppercase" }}>{e.category?.replace(/_/g, " ")}</span>
                  {e.impact_channels?.[0] && (
                    <span style={{ fontSize: "9px", padding: "1px 6px", backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#C084FC", borderRadius: "3px", letterSpacing: "1px", textTransform: "uppercase" }}>
                      {e.impact_channels[0].replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "10px", color: "#475569" }}>
                  {new Date(e.published_at || e.ingested_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#E2E8F0", margin: "0 0 6px 0", lineHeight: "1.4", fontWeight: "500" }}>{e.title}</p>
              {e.llm_reasoning && (
                <div style={{ marginTop: "8px", padding: "8px 10px", fontSize: "11px", color: "#94A3B8", backgroundColor: "rgba(74, 222, 128, 0.05)", borderLeft: "2px solid #4ADE80", borderRadius: "0 4px 4px 0", fontStyle: "italic", lineHeight: "1.5" }}>
                  💡 {e.llm_reasoning}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function OwnershipTab({ ownership, company, fmt }) {
  if (!ownership) {
    return <div style={emptyBox}>No ownership data available yet</div>;
  }
  const isIndian = company.country === "India";
  return (
    <div>
      <section style={section}>
        <h2 style={sectionTitle}>● OWNERSHIP STRUCTURE</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
          {isIndian ? (
            <>
              <MetricCard label="PROMOTER" value={fmt.pct(ownership.promoter_holding)} color="#60A5FA" />
              <MetricCard label="FII HOLDING" value={fmt.pct(ownership.fii_holding)} color="#C084FC" />
              <MetricCard label="DII HOLDING" value={fmt.pct(ownership.dii_holding)} color="#4ADE80" />
              <MetricCard label="PUBLIC" value={fmt.pct(ownership.public_holding)} />
            </>
          ) : (
            <>
              <MetricCard label="INSIDERS" value={fmt.pct(ownership.insider_ownership)} color="#60A5FA" />
              <MetricCard label="INSTITUTIONS" value={fmt.pct(ownership.institutional_ownership)} color="#C084FC" />
              <MetricCard label="FLOAT" value={fmt.num(ownership.float_shares, 0)} />
              <MetricCard label="SHORT INTEREST" value={fmt.pct(ownership.short_interest)} color="#FF8C42" />
              <MetricCard label="SHORT RATIO" value={fmt.ratio(ownership.short_ratio)} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function AnalystsTab({ ratings, fmt, currency }) {
  if (!ratings) {
    return <div style={emptyBox}>No analyst coverage data yet</div>;
  }
  
  const recColor = {
    STRONG_BUY: "#22C55E", BUY: "#4ADE80", HOLD: "#FCD34D",
    SELL: "#FF8C42", STRONG_SELL: "#FF3B3B",
  }[ratings.consensus_rating] || "#64748B";
  
  return (
    <div>
      <section style={section}>
        <h2 style={sectionTitle}>● ANALYST CONSENSUS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "16px" }}>
          <MetricCard label="CONSENSUS" value={ratings.consensus_rating?.replace("_", " ")} color={recColor} />
          <MetricCard label="ANALYSTS COVERING" value={fmt.num(ratings.total_analysts, 0)} />
          <MetricCard label="RATING SCORE" value={fmt.ratio(ratings.rating_score)} />
        </div>
      </section>
      
      <section style={section}>
        <h2 style={sectionTitle}>● PRICE TARGETS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
          <MetricCard label="HIGH TARGET" value={fmt.money(ratings.target_price_high, currency).replace(/[A-Z]/g, "")} color="#4ADE80" />
          <MetricCard label="AVG TARGET" value={fmt.money(ratings.target_price_avg, currency).replace(/[A-Z]/g, "")} color="#60A5FA" />
          <MetricCard label="LOW TARGET" value={fmt.money(ratings.target_price_low, currency).replace(/[A-Z]/g, "")} color="#FF8C42" />
          <MetricCard label="UPSIDE" value={fmt.pct(ratings.upside_percent, 1)} color={ratings.upside_percent > 0 ? "#4ADE80" : "#FF3B3B"} />
        </div>
      </section>
    </div>
  );
}

function NetworkTab({ relationships, peers, router, fmt }) {
  const byType = {};
  relationships.forEach(r => {
    if (!byType[r.relationship_type]) byType[r.relationship_type] = [];
    byType[r.relationship_type].push(r);
  });
  
  return (
    <div>
      {Object.keys(byType).length > 0 && (
        <section style={section}>
          <h2 style={sectionTitle}>● BUSINESS NETWORK</h2>
          {Object.entries(byType).map(([type, rels]) => (
            <div key={type} style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#64748B", marginBottom: "8px", textTransform: "uppercase" }}>
                {type.replace("_", " ")} ({rels.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
                {rels.map((r, i) => (
                  <div key={i} onClick={() => router.push(`/company/${r.ticker}`)}
                    style={{ padding: "10px 12px", backgroundColor: "rgba(10, 17, 32, 0.6)", border: "1px solid #1E293B", borderRadius: "6px", cursor: "pointer" }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = "#3B82F6"}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = "#1E293B"}>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#F1F5F9", marginBottom: "2px" }}>{r.ticker}</div>
                    <div style={{ fontSize: "10px", color: "#94A3B8", marginBottom: "4px" }}>{r.name}</div>
                    <div style={{ fontSize: "9px", color: "#64748B", fontStyle: "italic" }}>{r.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
      
      {peers.length > 0 && (
        <section style={section}>
          <h2 style={sectionTitle}>● SECTOR PEERS</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            {peers.map(p => (
              <div key={p.ticker} onClick={() => router.push(`/company/${p.ticker}`)}
                style={{ padding: "12px 14px", backgroundColor: "rgba(10, 17, 32, 0.6)", border: "1px solid #1E293B", borderRadius: "6px", cursor: "pointer" }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = "#3B82F6"}
                onMouseOut={(e) => e.currentTarget.style.borderColor = "#1E293B"}>
                <div style={{ fontSize: "12px", fontWeight: "bold", color: "#F1F5F9", marginBottom: "2px" }}>{p.ticker}</div>
                <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "4px" }}>{p.name}</div>
                <div style={{ fontSize: "10px", color: "#60A5FA" }}>{fmt.money(p.market_cap_usd, "USD")}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DetailsTab({ company, price, fmt }) {
  return (
    <section style={section}>
      <h2 style={sectionTitle}>● COMPANY DETAILS</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
        <DetailRow label="Legal Name" value={company.legal_name || company.name} />
        <DetailRow label="Ticker" value={company.ticker} />
        <DetailRow label="Exchange" value={company.exchange} />
        <DetailRow label="ISIN" value={company.isin} />
        <DetailRow label="Sector" value={company.sector} />
        <DetailRow label="Industry" value={company.industry} />
        <DetailRow label="Country" value={company.country} />
        <DetailRow label="HQ City" value={company.headquarters_city} />
        <DetailRow label="CEO" value={company.ceo} />
        <DetailRow label="Founded" value={company.founded_year} />
        <DetailRow label="Employees" value={fmt.num(company.employees, 0)} />
        <DetailRow label="Currency" value={price?.currency || company.currency} />
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
  );
}

// ============================================
// SMALL HELPERS
// ============================================

function StatBox({ label, value, color }) {
  return (
    <div style={{ padding: "10px 12px", backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid #1E293B", borderRadius: "5px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "1.5px", color: "#64748B", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "15px", fontWeight: "bold", color: color || "#F1F5F9", letterSpacing: "0.5px" }}>{value}</div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{ padding: "12px 14px", backgroundColor: "rgba(15, 23, 42, 0.5)", border: "1px solid #1E293B", borderRadius: "6px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "1.5px", color: "#64748B", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: "bold", color: color || "#F1F5F9" }}>{value}</div>
    </div>
  );
}

function FinRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #1E293B" }}>
      <span style={{ fontSize: "12px", color: "#94A3B8" }}>{label}</span>
      <span style={{ fontSize: "12px", fontWeight: "bold", color: "#F1F5F9" }}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "rgba(15, 23, 42, 0.5)", borderRadius: "4px", fontSize: "11px" }}>
      <span style={{ color: "#64748B", letterSpacing: "1px" }}>{label}</span>
      <span style={{ color: "#E2E8F0", fontWeight: "500" }}>{value || "—"}</span>
    </div>
  );
}

// ============================================
// STYLES
// ============================================

const loadingStyle = { minHeight: "100vh", backgroundColor: "#030712", color: "#E2E8F0", padding: "40px", textAlign: "center", fontFamily: "'Courier New', monospace", paddingTop: "120px" };
const btnStyle = { marginTop: "20px", padding: "10px 20px", backgroundColor: "#3B82F6", border: "none", color: "white", borderRadius: "6px", cursor: "pointer" };
const headerStyle = { position: "sticky", top: 0, backgroundColor: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid #1E293B", padding: "12px 24px", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between" };
const backBtn = { background: "transparent", border: "1px solid #334155", color: "#94A3B8", padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontFamily: "inherit", letterSpacing: "1px" };
const btnSmall = { padding: "5px 10px", backgroundColor: "#0F172A", border: "1px solid #334155", color: "#94A3B8", borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontFamily: "inherit", letterSpacing: "1px" };
const section = { marginBottom: "20px", padding: "20px 22px", backgroundColor: "#0a1120", border: "1px solid #1E293B", borderRadius: "8px" };
const sectionTitle = { fontSize: "11px", letterSpacing: "3px", color: "#4ADE80", margin: "0 0 16px 0", fontWeight: "bold", paddingBottom: "10px", borderBottom: "1px solid #1E293B" };
const tag = { display: "inline-block", padding: "3px 10px", fontSize: "10px", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#60A5FA", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "3px", letterSpacing: "1px" };
const tabsBar = { display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid #1E293B", overflowX: "auto" };
const tabStyle = { padding: "10px 16px", fontSize: "11px", letterSpacing: "1.5px", cursor: "pointer", whiteSpace: "nowrap", transition: "color 0.2s" };
const emptyBox = { padding: "40px 20px", textAlign: "center", color: "#475569", fontSize: "13px", border: "1px dashed #1E293B", borderRadius: "6px", backgroundColor: "#0a1120" };
