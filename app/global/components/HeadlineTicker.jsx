"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HeadlineTicker({ 
  bucket = "geopolitics",  // geopolitics | markets | tech_lifestyle
  direction = "left",       // "left" = R→L, "right" = L→R
  label = "GEOPOLITICS",
  accentColor = "#C084FC",
  speed = 60,               // seconds per loop
}) {
  const router = useRouter();
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        // Different categories per bucket
        let categories = [];
        if (bucket === "geopolitics") {
          categories = ["geopolitics", "defense", "hot_conflict", "military", "diplomacy"];
        } else if (bucket === "markets") {
          categories = ["economy", "markets", "energy"];
        } else if (bucket === "tech_lifestyle") {
          categories = ["tech", "technology", "climate", "health", "social", "science", "culture"];
        }
        
        // Fetch articles for these categories
        const promises = categories.map(c => 
          fetch(`/api/global/articles?category=${c}&limit=8`).then(r => r.json())
        );
        const results = await Promise.all(promises);
        
        let combined = [];
        results.forEach(r => {
          if (r.success && r.data.articles) {
            combined = combined.concat(r.data.articles);
          }
        });
        
        // Dedupe by slug and take latest 12
        const seen = new Set();
        const unique = combined.filter(a => {
          if (seen.has(a.slug)) return false;
          seen.add(a.slug);
          return true;
        });
        
        // Sort by published_at desc
        unique.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
        
        setArticles(unique.slice(0, 12));
      } catch (err) {
        console.error("Ticker load failed:", err);
      }
    }
    load();
    const interval = setInterval(load, 300000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [bucket]);

  if (articles.length === 0) return null;

  // Animation: scroll right means content moves L→R (translateX from -50% to 0)
  const animName = direction === "right" ? `ticker-scroll-right-${bucket}` : `ticker-scroll-left-${bucket}`;

  return (
    <div style={{
      backgroundColor: "#000000",
      borderTop: "1px solid #1F2937",
      borderBottom: "1px solid #1F2937",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      alignItems: "center",
    }}>
      {/* Label badge */}
      <div style={{
        flexShrink: 0,
        backgroundColor: accentColor,
        color: "#000000",
        padding: "8px 14px",
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        zIndex: 2,
        position: "relative",
      }}>
        ● {label}
      </div>

      {/* Fade left edge */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: "200px",
        background: "linear-gradient(90deg, #000000 60%, transparent 100%)",
        zIndex: 1,
        pointerEvents: "none",
      }} />
      
      {/* Fade right edge */}
      <div style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: "100px",
        background: "linear-gradient(-90deg, #000000 0%, transparent 100%)",
        zIndex: 1,
        pointerEvents: "none",
      }} />

      {/* Scrolling content */}
      <div style={{
        display: "inline-flex",
        whiteSpace: "nowrap",
        animation: `${animName} ${speed}s linear infinite`,
        paddingLeft: "20px",
      }}>
        {[...articles, ...articles].map((a, i) => (
          <a
            key={`${a.slug}-${i}`}
            href={`/global/article/${a.slug}`}
            onClick={(e) => {
              e.preventDefault();
              router.push(`/global/article/${a.slug}`);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              marginRight: "48px",
              padding: "8px 0",
              textDecoration: "none",
              color: "#E8EAED",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
            onMouseOver={(e) => e.currentTarget.style.color = accentColor}
            onMouseOut={(e) => e.currentTarget.style.color = "#E8EAED"}
          >
            {a.article_type === "breaking" && (
              <span style={{
                color: "#EF4444",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "1px",
              }}>● BREAKING</span>
            )}
            <span style={{
              fontSize: "10px",
              color: accentColor,
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontWeight: "700",
            }}>
              {(a.region || "Global").substring(0, 10)}
            </span>
            <span>{a.title}</span>
            <span style={{ color: "#4B5563", fontSize: "11px" }}>·</span>
          </a>
        ))}
      </div>

      <style>{`
        @keyframes ticker-scroll-left-${bucket} {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes ticker-scroll-right-${bucket} {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
