"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GlobalHomepage() {
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [aRes, bRes] = await Promise.all([
          fetch("/api/global/articles?limit=30"),
          fetch("/api/global/brief"),
        ]);
        const aJson = await aRes.json();
        const bJson = await bRes.json();
        if (aJson.success) setArticles(aJson.data.articles || []);
        if (bJson.success) setBrief(bJson.data.brief);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      const res = await fetch("/api/global/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage" }),
      });
      const json = await res.json();
      if (json.success) {
        setSubscribeStatus({ ok: true, msg: json.message });
        setEmail("");
      } else {
        setSubscribeStatus({ ok: false, msg: json.error });
      }
    } catch (err) {
      setSubscribeStatus({ ok: false, msg: err.message });
    }
  };

  const categories = [
    { id: "all", label: "All" },
    { id: "geopolitics", label: "Geopolitics" },
    { id: "economy", label: "Economy" },
    { id: "energy", label: "Energy" },
    { id: "tech", label: "Technology" },
    { id: "defense", label: "Defense" },
    { id: "markets", label: "Markets" },
    { id: "climate", label: "Climate" },
  ];

  const filteredArticles = activeCategory === "all" 
    ? articles 
    : articles.filter(a => a.category === activeCategory);

  const featuredArticle = filteredArticles[0];
  const restArticles = filteredArticles.slice(1);

  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const agentLabel = (id) => {
    const map = {
      editorial: "Editorial",
      geopolitik: "The Geopolitik",
      macro_mike: "Macro Mike",
      energy_hawk: "Energy Hawk",
      tech_skeptic: "Tech Skeptic",
      bharat_beat: "Bharat Beat",
      climate_watch: "Climate Watch",
      crypto_sage: "Crypto Sage",
    };
    return map[id] || "DSRT Global";
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0e1a", color: "#E8EAED", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* TOP NAV */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        backgroundColor: "rgba(10, 14, 26, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1F2937",
        padding: "16px 24px",
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.push("/global")}>
            <span style={{ fontSize: "24px" }}>🌐</span>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "1px", color: "#FFFFFF" }}>
                DSRT <span style={{ color: "#3B82F6" }}>GLOBAL</span>
              </div>
              <div style={{ fontSize: "10px", color: "#6B7280", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Intelligence, Decoded
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", gap: "24px", alignItems: "center", fontSize: "13px" }}>
            <a href="/global" style={navLink}>Latest</a>
            <a href="/global/brief" style={navLink}>The Brief</a>
            <a href="/global/category/geopolitics" style={navLink}>Geopolitics</a>
            <a href="/global/category/markets" style={navLink}>Markets</a>
            <a href="/global/category/tech" style={navLink}>Tech</a>
            <a href="/" style={{ ...navLink, color: "#3B82F6", padding: "6px 12px", border: "1px solid #3B82F6", borderRadius: "4px" }}>
              ↗ DSRT WAE Terminal
            </a>
          </nav>
        </div>
      </header>

      {/* HERO BAND - Today's Brief Teaser */}
      {brief && (
        <section style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(168, 85, 247, 0.05))",
          borderBottom: "1px solid #1F2937",
          padding: "40px 24px",
        }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
            
            <div style={{ flex: "1 1 400px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#3B82F6", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase" }}>
                📊 Today's Intelligence Brief
              </div>
              <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#FFFFFF", margin: "0 0 12px 0", lineHeight: "1.2" }}>
                Global Heat Index: <span style={{ color: getHeatColor(brief.global_heat_index) }}>{brief.global_heat_index}</span>
              </h1>
              <p style={{ fontSize: "14px", color: "#9CA3AF", margin: "0 0 16px 0", lineHeight: "1.6" }}>
                Threat Level: <strong style={{ color: getHeatColor(brief.global_heat_index) }}>{brief.threat_level}</strong>
                {brief.heat_change !== 0 && (
                  <span> · {brief.heat_change > 0 ? "↑" : "↓"} {Math.abs(brief.heat_change)} from yesterday</span>
                )}
              </p>
              <button 
                onClick={() => router.push("/global/brief")}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#3B82F6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                }}
              >
                Read Today's Brief →
              </button>
            </div>

            {/* 5 things sidebar */}
            <div style={{ flex: "1 1 400px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#6B7280", marginBottom: "12px", textTransform: "uppercase", fontWeight: "600" }}>
                5 Things to Know
              </div>
              <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {(brief.headlines || []).slice(0, 5).map((h, i) => (
                  <li key={i} style={{ display: "flex", gap: "10px", padding: "6px 0", borderBottom: i < 4 ? "1px solid #1F2937" : "none", fontSize: "13px" }}>
                    <span style={{ color: "#3B82F6", fontWeight: "700", minWidth: "20px" }}>{i + 1}.</span>
                    <span style={{ color: "#D1D5DB", lineHeight: "1.5" }}>{h.headline}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* CATEGORY FILTER */}
      <div style={{ borderBottom: "1px solid #1F2937", padding: "16px 24px", backgroundColor: "#0F1623", position: "sticky", top: "73px", zIndex: 50 }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", gap: "4px", overflowX: "auto" }}>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              style={{
                padding: "8px 16px",
                backgroundColor: activeCategory === c.id ? "#3B82F6" : "transparent",
                color: activeCategory === c.id ? "white" : "#9CA3AF",
                border: `1px solid ${activeCategory === c.id ? "#3B82F6" : "#374151"}`,
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                letterSpacing: "0.5px",
                transition: "all 0.15s",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        
        {loading ? (
          <div style={{ padding: "80px 20px", textAlign: "center", color: "#6B7280" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📰</div>
            Loading intelligence...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div style={{ padding: "80px 20px", textAlign: "center", color: "#6B7280" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</div>
            <div style={{ fontSize: "16px", marginBottom: "8px", color: "#D1D5DB" }}>No articles yet</div>
            <div style={{ fontSize: "12px" }}>Check back soon — new analysis publishes every 30 minutes</div>
          </div>
        ) : (
          <>
            {/* FEATURED + GRID LAYOUT */}
            {featuredArticle && (
              <div 
                onClick={() => router.push(`/global/article/${featuredArticle.slug}`)}
                style={{
                  marginBottom: "32px",
                  padding: "32px",
                  backgroundColor: "#111827",
                  border: "1px solid #1F2937",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = "#3B82F6"}
                onMouseOut={(e) => e.currentTarget.style.borderColor = "#1F2937"}
              >
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <span style={categoryBadge(featuredArticle.category)}>{featuredArticle.category}</span>
                  {featuredArticle.article_type === "breaking" && (
                    <span style={breakingBadge}>● BREAKING</span>
                  )}
                  <span style={metaBadge}>{featuredArticle.reading_time_minutes || 3} min read</span>
                </div>
                <h2 style={{ fontSize: "32px", fontWeight: "700", color: "#FFFFFF", margin: "0 0 12px 0", lineHeight: "1.2" }}>
                  {featuredArticle.title}
                </h2>
                {featuredArticle.subtitle && (
                  <p style={{ fontSize: "18px", color: "#9CA3AF", margin: "0 0 16px 0", lineHeight: "1.5" }}>
                    {featuredArticle.subtitle}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#6B7280" }}>
                  <span style={{ color: "#3B82F6", fontWeight: "600" }}>By {agentLabel(featuredArticle.agent_persona)}</span>
                  <span>·</span>
                  <span>{fmtDate(featuredArticle.published_at)}</span>
                  {featuredArticle.region && (
                    <>
                      <span>·</span>
                      <span>📍 {featuredArticle.region}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ARTICLE GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {restArticles.map(article => (
                <article
                  key={article.slug}
                  onClick={() => router.push(`/global/article/${article.slug}`)}
                  style={{
                    padding: "20px",
                    backgroundColor: "#111827",
                    border: "1px solid #1F2937",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#3B82F6";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#1F2937";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <span style={categoryBadge(article.category)}>{article.category}</span>
                    {article.article_type === "breaking" && <span style={breakingBadge}>● LIVE</span>}
                  </div>
                  
                  <h3 style={{ fontSize: "17px", fontWeight: "600", color: "#FFFFFF", margin: "0 0 8px 0", lineHeight: "1.35", flex: 1 }}>
                    {article.title}
                  </h3>
                  
                  {article.summary_short && (
                    <p style={{ fontSize: "13px", color: "#9CA3AF", margin: "0 0 12px 0", lineHeight: "1.5" }}>
                      {article.summary_short}
                    </p>
                  )}
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid #1F2937", fontSize: "11px", color: "#6B7280" }}>
                    <span style={{ color: "#60A5FA" }}>{agentLabel(article.agent_persona)}</span>
                    <span>{fmtDate(article.published_at)}</span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {/* NEWSLETTER CTA */}
        <section style={{ 
          marginTop: "64px", 
          padding: "48px 32px", 
          background: "linear-gradient(135deg, #1E40AF, #6D28D9)", 
          borderRadius: "16px",
          textAlign: "center",
        }}>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#FFFFFF", margin: "0 0 12px 0" }}>
            Get The DSRT Brief
          </h2>
          <p style={{ fontSize: "15px", color: "#E0E7FF", margin: "0 0 24px 0", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
            5 things you need to know about the world, every morning. Free. Written by AI. Built by DSRT WAE.
          </p>
          <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "8px", maxWidth: "440px", margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                flex: "1 1 240px",
                padding: "12px 16px",
                backgroundColor: "rgba(255,255,255,0.95)",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                color: "#111827",
              }}
            />
            <button 
              type="submit"
              style={{
                padding: "12px 24px",
                backgroundColor: "#FFFFFF",
                color: "#1E40AF",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              SUBSCRIBE FREE
            </button>
          </form>
          {subscribeStatus && (
            <div style={{ 
              marginTop: "16px", 
              fontSize: "13px", 
              color: subscribeStatus.ok ? "#86EFAC" : "#FCA5A5",
              fontWeight: "600",
            }}>
              {subscribeStatus.ok ? "✓ " : "⚠ "}{subscribeStatus.msg}
            </div>
          )}
        </section>

      </main>

      {/* FOOTER */}
      <footer style={{ 
        borderTop: "1px solid #1F2937", 
        padding: "32px 24px", 
        marginTop: "64px",
        backgroundColor: "#0F1623",
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", fontSize: "12px", color: "#6B7280" }}>
          <div>
            <strong style={{ color: "#D1D5DB" }}>DSRT GLOBAL</strong> · A DSRT Group Company · Powered by DSRT WAE
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <a href="/global" style={{ color: "#6B7280", textDecoration: "none" }}>Home</a>
            <a href="/global/brief" style={{ color: "#6B7280", textDecoration: "none" }}>Daily Brief</a>
            <a href="/" style={{ color: "#3B82F6", textDecoration: "none" }}>DSRT WAE Terminal →</a>
          </div>
        </div>
        <div style={{ maxWidth: "1400px", margin: "16px auto 0", fontSize: "10px", color: "#4B5563", textAlign: "center" }}>
          Articles auto-generated by AI. Not financial advice. For informational purposes only.
        </div>
      </footer>
    </div>
  );
}

const navLink = {
  color: "#D1D5DB",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: "500",
  letterSpacing: "0.3px",
  transition: "color 0.15s",
};

const metaBadge = {
  fontSize: "11px",
  padding: "3px 10px",
  backgroundColor: "rgba(107, 114, 128, 0.15)",
  color: "#9CA3AF",
  borderRadius: "4px",
  fontWeight: "500",
  letterSpacing: "0.3px",
};

const breakingBadge = {
  fontSize: "11px",
  padding: "3px 10px",
  backgroundColor: "rgba(239, 68, 68, 0.15)",
  color: "#F87171",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  borderRadius: "4px",
  fontWeight: "700",
  letterSpacing: "0.5px",
  animation: "pulse 2s infinite",
};

function categoryBadge(cat) {
  const colors = {
    geopolitics: { bg: "rgba(168, 85, 247, 0.15)", color: "#C084FC", border: "rgba(168, 85, 247, 0.3)" },
    economy: { bg: "rgba(59, 130, 246, 0.15)", color: "#60A5FA", border: "rgba(59, 130, 246, 0.3)" },
    tech: { bg: "rgba(34, 197, 94, 0.15)", color: "#4ADE80", border: "rgba(34, 197, 94, 0.3)" },
    energy: { bg: "rgba(251, 146, 60, 0.15)", color: "#FB923C", border: "rgba(251, 146, 60, 0.3)" },
    defense: { bg: "rgba(220, 38, 38, 0.15)", color: "#F87171", border: "rgba(220, 38, 38, 0.3)" },
    markets: { bg: "rgba(20, 184, 166, 0.15)", color: "#2DD4BF", border: "rgba(20, 184, 166, 0.3)" },
    climate: { bg: "rgba(16, 185, 129, 0.15)", color: "#34D399", border: "rgba(16, 185, 129, 0.3)" },
    crypto: { bg: "rgba(245, 158, 11, 0.15)", color: "#FBBF24", border: "rgba(245, 158, 11, 0.3)" },
    science: { bg: "rgba(99, 102, 241, 0.15)", color: "#818CF8", border: "rgba(99, 102, 241, 0.3)" },
  };
  const c = colors[cat] || colors.economy;
  return {
    fontSize: "10px",
    padding: "3px 10px",
    backgroundColor: c.bg,
    color: c.color,
    border: `1px solid ${c.border}`,
    borderRadius: "4px",
    fontWeight: "700",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  };
}

function getHeatColor(heat) {
  const h = parseFloat(heat) || 0;
  if (h >= 8) return "#EF4444";
  if (h >= 6) return "#F59E0B";
  if (h >= 4) return "#FBBF24";
  if (h >= 2) return "#60A5FA";
  return "#4ADE80";
}
