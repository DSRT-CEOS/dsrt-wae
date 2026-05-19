"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;
  
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [aRes, sRes] = await Promise.all([
          fetch(`/api/global/articles?slug=${slug}`),
          fetch("/api/global/stats"),
        ]);
        const aJson = await aRes.json();
        const sJson = await sRes.json();
        if (aJson.success) {
          setArticle(aJson.data.article);
          setRelated(aJson.data.related || []);
        } else {
          setError(aJson.error);
        }
        if (sJson.success) setStats(sJson.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (slug) load();
  }, [slug]);

  if (loading) {
    return <div style={loadingStyle}>Loading article...</div>;
  }
  if (error || !article) {
    return (
      <div style={loadingStyle}>
        <div style={{ fontSize: "32px", marginBottom: "16px" }}>📰</div>
        <p>{error || "Article not found"}</p>
        <button onClick={() => router.push("/global")} style={btnStyle}>← Back to DSRT Global</button>
      </div>
    );
  }

  const fmtDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const agentLabel = (id) => {
    const map = {
      editorial: "Editorial", geopolitik: "The Geopolitik",
      macro_mike: "Macro Mike", energy_hawk: "Energy Hawk",
      tech_skeptic: "Tech Skeptic", bharat_beat: "Bharat Beat",
      climate_watch: "Climate Watch", crypto_sage: "Crypto Sage",
    };
    return map[id] || "DSRT Global";
  };

  // Determine "heat" of this article from triggering event or category
  const articleHeat = stats?.regional_heat?.[article.region] || 5;
  const heatColor = articleHeat >= 8 ? "#EF4444" : articleHeat >= 6 ? "#F59E0B" : articleHeat >= 4 ? "#FBBF24" : "#60A5FA";

  // Render body markdown
  const renderBody = (md) => {
    if (!md) return null;
    const lines = md.split("\n");
    const elements = [];
    let listItems = [];
    
    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} style={{ margin: "16px 0", paddingLeft: "24px", color: "#D1D5DB" }}>
            {listItems.map((item, i) => (
              <li key={i} style={{ marginBottom: "8px", lineHeight: "1.7" }}>{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };
    
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) { flushList(); return; }
      if (trimmed.startsWith("## ")) {
        flushList();
        elements.push(<h2 key={i} style={{ fontSize: "22px", fontWeight: "700", color: "#FFFFFF", marginTop: "32px", marginBottom: "16px", lineHeight: "1.3" }}>{trimmed.replace(/^##\s+/, "")}</h2>);
        return;
      }
      if (trimmed.startsWith("### ")) {
        flushList();
        elements.push(<h3 key={i} style={{ fontSize: "18px", fontWeight: "600", color: "#FFFFFF", marginTop: "24px", marginBottom: "12px" }}>{trimmed.replace(/^###\s+/, "")}</h3>);
        return;
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        listItems.push(trimmed.replace(/^[-*]\s+/, ""));
        return;
      }
      flushList();
      const withBold = trimmed.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j} style={{ color: "#FFFFFF", fontWeight: "600" }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      elements.push(<p key={i} style={{ fontSize: "16px", lineHeight: "1.75", color: "#D1D5DB", marginBottom: "20px" }}>{withBold}</p>);
    });
    flushList();
    return elements;
  };

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
            <div style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "1px", color: "#FFFFFF" }}>
              DSRT <span style={{ color: "#3B82F6" }}>GLOBAL</span>
            </div>
          </div>
          <nav style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
            <a href="/global" style={navLink}>← All Articles</a>
            <a href="/global/brief" style={navLink}>The Brief</a>
            <a href="/global/dashboard" style={navLink}>Dashboard</a>
            <a href="/" style={{ ...navLink, color: "#3B82F6" }}>WAE ↗</a>
          </nav>
        </div>
      </header>

      {/* ARTICLE WITH SIDE PANEL */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "1fr 320px", gap: "48px" }} className="article-layout">
        
        {/* MAIN ARTICLE */}
        <article>
          {/* Meta */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            <span style={categoryBadge(article.category)}>{article.category}</span>
            {article.article_type === "breaking" && <span style={breakingBadge}>● BREAKING</span>}
            <span style={metaBadge}>{article.reading_time_minutes || 3} min read</span>
          </div>

          <h1 style={{ fontSize: "42px", fontWeight: "800", color: "#FFFFFF", lineHeight: "1.15", marginBottom: "20px", letterSpacing: "-0.5px" }}>
            {article.title}
          </h1>

          {article.subtitle && (
            <p style={{ fontSize: "22px", color: "#9CA3AF", lineHeight: "1.4", marginBottom: "32px", fontWeight: "400" }}>
              {article.subtitle}
            </p>
          )}

          {/* Byline */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingTop: "20px", paddingBottom: "32px", borderTop: "1px solid #1F2937", borderBottom: "1px solid #1F2937", marginBottom: "32px", fontSize: "13px", color: "#9CA3AF" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "16px", fontWeight: "700" }}>
              {agentLabel(article.agent_persona).charAt(0)}
            </div>
            <div>
              <div style={{ color: "#FFFFFF", fontWeight: "600", marginBottom: "2px" }}>
                By {agentLabel(article.agent_persona)}
              </div>
              <div style={{ fontSize: "12px" }}>
                {fmtDate(article.published_at)}
                {article.region && ` · 📍 ${article.region}`}
                {article.countries && article.countries.length > 0 && ` · ${article.countries.slice(0, 3).join(", ")}`}
              </div>
            </div>
          </div>

          {/* Lead */}
          {article.lead_paragraph && (
            <p style={{ fontSize: "20px", lineHeight: "1.6", color: "#FFFFFF", marginBottom: "32px", fontWeight: "400", paddingLeft: "16px", borderLeft: "3px solid #3B82F6" }}>
              {article.lead_paragraph}
            </p>
          )}

          {/* Body */}
          <div>{renderBody(article.body_markdown)}</div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid #1F2937" }}>
              <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#6B7280", marginBottom: "12px", textTransform: "uppercase", fontWeight: "600" }}>
                Tagged
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {article.tags.map(tag => (
                  <span key={tag} style={{ padding: "5px 12px", backgroundColor: "#1F2937", color: "#9CA3AF", borderRadius: "20px", fontSize: "12px" }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Disclosure */}
          <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "8px", fontSize: "12px", color: "#6B7280", lineHeight: "1.6" }}>
            <strong style={{ color: "#9CA3AF" }}>About this article:</strong> Generated by DSRT WAE's AI intelligence engine. For informational purposes only. <a href="/" style={{ color: "#3B82F6", textDecoration: "none" }}>How DSRT WAE works →</a>
          </div>
        </article>

        {/* SIDE PANEL — VISUALIZATIONS */}
        <aside style={{ position: "sticky", top: "100px", alignSelf: "start", display: "flex", flexDirection: "column", gap: "20px" }} className="article-sidebar">
          
          {/* Regional Heat Indicator */}
          {article.region && (
            <div style={sidePanel}>
              <div style={panelTitle}>📍 {article.region}</div>
              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#6B7280", letterSpacing: "1.5px", marginBottom: "8px", textTransform: "uppercase", fontWeight: "600" }}>
                  Regional Heat
                </div>
                <div style={{ fontSize: "48px", fontWeight: "800", color: heatColor, lineHeight: 1 }}>
                  {articleHeat.toFixed(1)}
                </div>
                <div style={{ fontSize: "11px", color: heatColor, marginTop: "6px", fontWeight: "700", letterSpacing: "1px" }}>
                  ● {articleHeat >= 8 ? "CRITICAL" : articleHeat >= 6 ? "HIGH" : articleHeat >= 4 ? "ELEVATED" : "MODERATE"}
                </div>
                <div style={{ fontSize: "10px", color: "#6B7280", marginTop: "8px" }}>
                  Last 24 hours
                </div>
              </div>
            </div>
          )}

          {/* Countries Affected */}
          {article.countries && article.countries.length > 0 && (
            <div style={sidePanel}>
              <div style={panelTitle}>🌍 Countries</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                {article.countries.map(c => (
                  <span key={c} style={{
                    padding: "6px 10px",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    color: "#60A5FA",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Article Stats */}
          <div style={sidePanel}>
            <div style={panelTitle}>📊 Article Stats</div>
            <div style={{ marginTop: "16px" }}>
              <StatRow label="Reading Time" value={`${article.reading_time_minutes || 3} min`} />
              <StatRow label="Word Count" value={(article.body_markdown?.split(/\s+/).length || 0).toString()} />
              <StatRow label="Views" value={(article.view_count || 0).toString()} />
              <StatRow label="Category" value={article.category} />
              <StatRow label="AI Confidence" value={`${Math.round((article.confidence_score || 0.8) * 100)}%`} color="#4ADE80" />
              <StatRow label="Quality Score" value={`${article.quality_score || 8}/10`} color="#60A5FA" />
            </div>
          </div>

          {/* Related Articles Mini */}
          {related.length > 0 && (
            <div style={sidePanel}>
              <div style={panelTitle}>📰 Related</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                {related.slice(0, 3).map(r => (
                  <div 
                    key={r.slug}
                    onClick={() => router.push(`/global/article/${r.slug}`)}
                    style={{
                      cursor: "pointer",
                      padding: "12px",
                      backgroundColor: "#0a0e1a",
                      borderRadius: "6px",
                      borderLeft: "3px solid #3B82F6",
                      transition: "all 0.15s",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#1F2937"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#0a0e1a"}
                  >
                    <div style={{ fontSize: "13px", color: "#FFFFFF", fontWeight: "600", lineHeight: "1.4", marginBottom: "4px" }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: "10px", color: "#6B7280" }}>
                      {r.reading_time_minutes || 3} min · {r.category}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ ...sidePanel, background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(168, 85, 247, 0.1))", borderColor: "#3B82F6" }}>
            <div style={{ fontSize: "13px", color: "#FFFFFF", fontWeight: "700", marginBottom: "8px" }}>
              Get Daily Intelligence
            </div>
            <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "12px", lineHeight: "1.5" }}>
              5 things to know about the world, every morning.
            </div>
            <button 
              onClick={() => router.push("/global")}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#3B82F6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              SUBSCRIBE FREE
            </button>
          </div>
        </aside>
      </div>

      <footer style={{ borderTop: "1px solid #1F2937", padding: "32px 24px", backgroundColor: "#0F1623" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", textAlign: "center", color: "#6B7280", fontSize: "12px" }}>
          DSRT GLOBAL · Powered by DSRT WAE · <a href="/" style={{ color: "#3B82F6", textDecoration: "none" }}>WAE Terminal →</a>
        </div>
      </footer>

      <style>{`
        @media (max-width: 1024px) {
          .article-layout { grid-template-columns: 1fr !important; }
          .article-sidebar { position: static !important; }
        }
      `}</style>
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1F2937", fontSize: "12px" }}>
      <span style={{ color: "#9CA3AF", textTransform: "capitalize" }}>{label}</span>
      <span style={{ color: color || "#FFFFFF", fontWeight: "600" }}>{value}</span>
    </div>
  );
}

const navLink = { color: "#D1D5DB", textDecoration: "none", fontSize: "13px", fontWeight: "500" };
const loadingStyle = { minHeight: "100vh", backgroundColor: "#0a0e1a", color: "#9CA3AF", padding: "100px 20px", textAlign: "center", fontFamily: "'Inter', sans-serif" };
const btnStyle = { marginTop: "20px", padding: "10px 20px", backgroundColor: "#3B82F6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };

const sidePanel = {
  padding: "20px",
  backgroundColor: "#111827",
  border: "1px solid #1F2937",
  borderRadius: "10px",
};

const panelTitle = {
  fontSize: "11px",
  letterSpacing: "1.5px",
  color: "#6B7280",
  textTransform: "uppercase",
  fontWeight: "700",
  paddingBottom: "10px",
  borderBottom: "1px solid #1F2937",
};

const metaBadge = {
  fontSize: "11px", padding: "3px 10px",
  backgroundColor: "rgba(107, 114, 128, 0.15)", color: "#9CA3AF",
  borderRadius: "4px", fontWeight: "500",
};

const breakingBadge = {
  fontSize: "11px", padding: "3px 10px",
  backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#F87171",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  borderRadius: "4px", fontWeight: "700", letterSpacing: "0.5px",
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
  };
  const c = colors[cat] || colors.economy;
  return {
    fontSize: "11px", padding: "4px 12px",
    backgroundColor: c.bg, color: c.color,
    border: `1px solid ${c.border}`,
    borderRadius: "4px", fontWeight: "700",
    letterSpacing: "0.8px", textTransform: "uppercase",
  };
}
