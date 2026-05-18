"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;
  
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/global/articles?slug=${slug}`);
        const json = await res.json();
        if (json.success) {
          setArticle(json.data.article);
          setRelated(json.data.related || []);
        } else {
          setError(json.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (slug) load();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0a0e1a", color: "#9CA3AF", padding: "100px 20px", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>
        Loading article...
      </div>
    );
  }

  if (error || !article) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0a0e1a", color: "#9CA3AF", padding: "100px 20px", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: "32px", marginBottom: "16px" }}>📰</div>
        <p>{error || "Article not found"}</p>
        <button 
          onClick={() => router.push("/global")} 
          style={{ marginTop: "20px", padding: "10px 20px", backgroundColor: "#3B82F6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          ← Back to DSRT Global
        </button>
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

  // Convert markdown to simple HTML (lightweight)
  const renderBody = (md) => {
    if (!md) return null;
    
    const lines = md.split("\n");
    const elements = [];
    let inList = false;
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
      inList = false;
    };
    
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        return;
      }
      
      // H2
      if (trimmed.startsWith("## ")) {
        flushList();
        elements.push(
          <h2 key={i} style={{ 
            fontSize: "22px", 
            fontWeight: "700", 
            color: "#FFFFFF", 
            marginTop: "32px", 
            marginBottom: "16px",
            lineHeight: "1.3",
          }}>
            {trimmed.replace(/^##\s+/, "")}
          </h2>
        );
        return;
      }
      
      // H3
      if (trimmed.startsWith("### ")) {
        flushList();
        elements.push(
          <h3 key={i} style={{ 
            fontSize: "18px", 
            fontWeight: "600", 
            color: "#FFFFFF", 
            marginTop: "24px", 
            marginBottom: "12px",
          }}>
            {trimmed.replace(/^###\s+/, "")}
          </h3>
        );
        return;
      }
      
      // List item
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        inList = true;
        listItems.push(trimmed.replace(/^[-*]\s+/, ""));
        return;
      }
      
      // Paragraph
      flushList();
      // Handle bold **text**
      const withBold = trimmed.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j} style={{ color: "#FFFFFF", fontWeight: "600" }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      
      elements.push(
        <p key={i} style={{ 
          fontSize: "16px", 
          lineHeight: "1.75", 
          color: "#D1D5DB", 
          marginBottom: "20px",
        }}>
          {withBold}
        </p>
      );
    });
    
    flushList();
    return elements;
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => router.push("/global")}>
            <span style={{ fontSize: "24px" }}>🌐</span>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "1px", color: "#FFFFFF" }}>
                DSRT <span style={{ color: "#3B82F6" }}>GLOBAL</span>
              </div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
            <a href="/global" style={{ color: "#D1D5DB", textDecoration: "none", fontWeight: "500" }}>← All Articles</a>
            <a href="/global/brief" style={{ color: "#D1D5DB", textDecoration: "none", fontWeight: "500" }}>The Brief</a>
            <a href="/" style={{ color: "#3B82F6", textDecoration: "none", fontWeight: "500" }}>DSRT WAE ↗</a>
          </nav>
        </div>
      </header>

      {/* ARTICLE */}
      <article style={{ maxWidth: "780px", margin: "0 auto", padding: "48px 24px" }}>
        
        {/* Meta */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <span style={categoryBadge(article.category)}>{article.category}</span>
          {article.article_type === "breaking" && <span style={breakingBadge}>● BREAKING</span>}
          <span style={metaBadge}>{article.reading_time_minutes || 3} min read</span>
        </div>

        {/* Title */}
        <h1 style={{ 
          fontSize: "42px", 
          fontWeight: "800", 
          color: "#FFFFFF", 
          lineHeight: "1.15", 
          marginBottom: "20px",
          letterSpacing: "-0.5px",
        }}>
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p style={{ 
            fontSize: "22px", 
            color: "#9CA3AF", 
            lineHeight: "1.4", 
            marginBottom: "32px",
            fontWeight: "400",
          }}>
            {article.subtitle}
          </p>
        )}

        {/* Byline */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "16px", 
          paddingTop: "20px",
          paddingBottom: "32px",
          borderTop: "1px solid #1F2937",
          borderBottom: "1px solid #1F2937",
          marginBottom: "32px",
          fontSize: "13px",
          color: "#9CA3AF",
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#3B82F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "16px",
            fontWeight: "700",
          }}>
            {agentLabel(article.agent_persona).charAt(0)}
          </div>
          <div>
            <div style={{ color: "#FFFFFF", fontWeight: "600", marginBottom: "2px" }}>
              By {agentLabel(article.agent_persona)}
            </div>
            <div style={{ fontSize: "12px" }}>
              {fmtDate(article.published_at)}
              {article.region && ` · ${article.region}`}
              {article.countries && article.countries.length > 0 && ` · ${article.countries.slice(0, 3).join(", ")}`}
            </div>
          </div>
        </div>

        {/* Lead */}
        {article.lead_paragraph && (
          <p style={{ 
            fontSize: "20px", 
            lineHeight: "1.6", 
            color: "#FFFFFF", 
            marginBottom: "32px",
            fontWeight: "400",
            paddingLeft: "16px",
            borderLeft: "3px solid #3B82F6",
          }}>
            {article.lead_paragraph}
          </p>
        )}

        {/* Body */}
        <div style={{ fontSize: "16px", lineHeight: "1.75", color: "#D1D5DB" }}>
          {renderBody(article.body_markdown)}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid #1F2937" }}>
            <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#6B7280", marginBottom: "12px", textTransform: "uppercase", fontWeight: "600" }}>
              Tagged
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {article.tags.map(tag => (
                <span key={tag} style={{
                  padding: "5px 12px",
                  backgroundColor: "#1F2937",
                  color: "#9CA3AF",
                  borderRadius: "20px",
                  fontSize: "12px",
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Disclosure */}
        <div style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#111827",
          border: "1px solid #1F2937",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#6B7280",
          lineHeight: "1.6",
        }}>
          <strong style={{ color: "#9CA3AF" }}>About this article:</strong> Generated by DSRT WAE's AI intelligence engine. Reviewed for quality and accuracy. For informational purposes only — not financial advice. <a href="/" style={{ color: "#3B82F6", textDecoration: "none" }}>Learn how DSRT WAE works →</a>
        </div>

      </article>

      {/* RELATED ARTICLES */}
      {related.length > 0 && (
        <section style={{ borderTop: "1px solid #1F2937", padding: "48px 24px", backgroundColor: "#0F1623" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#FFFFFF", marginBottom: "24px" }}>
              More from {article.category}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {related.map(r => (
                <div
                  key={r.slug}
                  onClick={() => router.push(`/global/article/${r.slug}`)}
                  style={{
                    padding: "20px",
                    backgroundColor: "#111827",
                    border: "1px solid #1F2937",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = "#3B82F6"}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = "#1F2937"}
                >
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#FFFFFF", marginBottom: "8px", lineHeight: "1.4" }}>
                    {r.title}
                  </h3>
                  {r.summary_short && (
                    <p style={{ fontSize: "13px", color: "#9CA3AF", lineHeight: "1.5", marginBottom: "12px" }}>
                      {r.summary_short}
                    </p>
                  )}
                  <div style={{ fontSize: "11px", color: "#6B7280" }}>
                    {r.reading_time_minutes || 3} min read
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #1F2937", padding: "32px 24px", backgroundColor: "#0F1623" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", textAlign: "center", color: "#6B7280", fontSize: "12px" }}>
          DSRT GLOBAL · Powered by DSRT WAE · <a href="/" style={{ color: "#3B82F6", textDecoration: "none" }}>Visit DSRT WAE Terminal →</a>
        </div>
      </footer>
    </div>
  );
}

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
    fontSize: "11px",
    padding: "4px 12px",
    backgroundColor: c.bg,
    color: c.color,
    border: `1px solid ${c.border}`,
    borderRadius: "4px",
    fontWeight: "700",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  };
}
