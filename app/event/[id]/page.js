"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id;

  const [event, setEvent] = useState(null);
  const [related, setRelated] = useState([]);
  const [cluster, setCluster] = useState([]);
  const [enrichment, setEnrichment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [reEnrichClicked, setReEnrichClicked] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/event/${eventId}`);
        const json = await res.json();
        if (json.success) {
          setEvent(json.data.event);
          setRelated(json.data.related || []);
          setCluster(json.data.cluster || []);

          const evt = json.data.event;
          // Detect old broken format (JSON array as string)
          const isOldFormat = evt.why_it_matters && 
                              typeof evt.why_it_matters === 'string' &&
                              (evt.why_it_matters.startsWith('[') || 
                               evt.why_it_matters.startsWith('{'));

          if (evt.ai_summary && !isOldFormat) {
            setEnrichment({
              ai_summary: evt.ai_summary,
              why_it_matters: evt.why_it_matters,
              what_happens_next: evt.what_happens_next,
              ai_analysis: evt.ai_analysis,
            });
          } else {
            // Auto re-enrich if no data or old broken format
            triggerEnrich();
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]);

  async function triggerEnrich() {
    setEnriching(true);
    setReEnrichClicked(true);
    try {
      const res = await fetch(`/api/event/${eventId}/enrich`, { method: "POST" });
      const json = await res.json();
      if (json.success) setEnrichment(json.data);
    } catch (err) {
      console.error("Enrich error:", err);
    } finally {
      setEnriching(false);
    }
  }

  const getHeatColor = (s) => {
    if (s >= 8) return "#FF3B3B";
    if (s >= 6) return "#FF8C42";
    if (s >= 4) return "#FCD34D";
    if (s >= 2) return "#60A5FA";
    return "#4ADE80";
  };

  const getHeatLabel = (s) => {
    if (s >= 8) return "CRITICAL";
    if (s >= 6) return "HIGH";
    if (s >= 4) return "MODERATE";
    if (s >= 2) return "LOW";
    return "STABLE";
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // Parse structured text: split by double newlines, render each as block
  const renderStructuredText = (text) => {
    if (!text || typeof text !== 'string') return null;
    
    // Clean any leftover JSON syntax
    let cleaned = text.replace(/^\[|\]$/g, '').trim();
    
    const blocks = cleaned.split(/\n\n+/).filter(b => b.trim());
    
    return blocks.map((block, i) => {
      const trimmed = block.trim();
      
      // Check if it has a label (UPPERCASE: content)
      const labelMatch = trimmed.match(/^([A-Z][A-Z\s\d()]+):\s*(.+)/s);
      
      if (labelMatch) {
        const [, label, content] = labelMatch;
        return (
          <div key={i} style={{
            marginBottom: "16px",
            padding: "14px 16px",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            border: "1px solid #1E293B",
            borderLeft: "3px solid #4ADE80",
            borderRadius: "0 6px 6px 0",
          }}>
            <div style={{
              fontSize: "10px",
              letterSpacing: "2px",
              color: "#4ADE80",
              fontWeight: "bold",
              marginBottom: "6px",
            }}>
              {label.trim()}
            </div>
            <div style={{
              fontSize: "13.5px",
              lineHeight: "1.7",
              color: "#CBD5E1",
            }}>
              {content.trim()}
            </div>
          </div>
        );
      }
      
      // Plain paragraph
      return (
        <p key={i} style={{
          fontSize: "13.5px",
          lineHeight: "1.7",
          color: "#CBD5E1",
          marginBottom: "12px",
        }}>
          {trimmed}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>🌍</div>
        <p>Loading event intelligence...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={loadingStyle}>
        <p>Event not found</p>
        <button onClick={() => router.push("/")} style={btnStyle}>Back to Dashboard</button>
      </div>
    );
  }

  const heatColor = getHeatColor(event.heat_score);
  const heatLabel = getHeatLabel(event.heat_score);

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#030712", 
      color: "#E2E8F0", 
      fontFamily: "'Courier New', monospace",
    }}>

      {/* HEADER */}
      <header style={headerStyle}>
        <button onClick={() => router.push("/")} style={backBtn}>
          ← BACK
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>🌍</span>
          <span style={{ letterSpacing: "2px", fontSize: "14px", fontWeight: "bold" }}>
            DSRT <span style={{ color: "#3B82F6" }}>WAE</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button style={btnSmall}>SAVE</button>
          <button style={btnSmall}>ALERT</button>
          <button style={btnSmall}>EXPORT</button>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "30px 24px" }}>

        {/* HERO: Heat + Meta */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "20px",
          marginBottom: "24px",
          padding: "20px",
          backgroundColor: `${heatColor}0D`,
          border: `1px solid ${heatColor}33`,
          borderLeft: `5px solid ${heatColor}`,
          borderRadius: "0 8px 8px 0",
        }}>
          <div style={{
            minWidth: "80px",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: "42px",
              fontWeight: "bold",
              color: heatColor,
              lineHeight: 1,
            }}>{event.heat_score}</div>
            <div style={{
              fontSize: "9px",
              letterSpacing: "2px",
              color: heatColor,
              fontWeight: "bold",
              marginTop: "6px",
            }}>{heatLabel}</div>
            <div style={{
              fontSize: "8px",
              letterSpacing: "1px",
              color: "#64748B",
              marginTop: "2px",
            }}>HEAT SCORE</div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: "10px",
              letterSpacing: "1.5px",
              color: "#64748B",
              marginBottom: "8px",
              textTransform: "uppercase",
            }}>
              {event.category?.replace(/_/g, " ")} | {event.region} | {formatDate(event.published_at || event.ingested_at)}
            </div>
            
            <h1 style={{
              fontSize: "24px",
              lineHeight: "1.35",
              color: "#F1F5F9",
              fontWeight: "bold",
              margin: "0 0 12px 0",
            }}>
              {event.title}
            </h1>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {event.countries?.slice(0, 5).map((c) => (
                <span key={c} style={countryTag}>{c}</span>
              ))}
              {event.source_name && (
                <span style={sourceTag}>via {event.source_name}</span>
              )}
            </div>
          </div>
        </div>

        {/* AI EXECUTIVE SUMMARY */}
        <section style={sectionBox}>
          <div style={sectionHeader}>
            <span style={sectionDot}>●</span>
            <h2 style={sectionTitle}>AI EXECUTIVE SUMMARY</h2>
            {enrichment && (
              <span style={badgeReady}>READY</span>
            )}
          </div>
          
          {enriching && (
            <div style={loadingBox}>
              <div style={{ 
                width: "16px", 
                height: "16px", 
                border: "2px solid #1E293B",
                borderTopColor: "#4ADE80",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                display: "inline-block",
                marginRight: "10px",
                verticalAlign: "middle",
              }} />
              Analyzing event with LLaMA 3... (15-25 seconds)
            </div>
          )}
          
          {enrichment?.ai_summary && !enriching && (
            <p style={summaryText}>
              {enrichment.ai_summary}
            </p>
          )}
          
          {!enrichment && !enriching && (
            <p style={{ color: "#64748B", fontSize: "13px", fontStyle: "italic" }}>
              {event.summary || "No summary available."}
            </p>
          )}
        </section>

        {/* WHY THIS MATTERS */}
        {enrichment?.why_it_matters && (
          <section style={sectionBox}>
            <div style={sectionHeader}>
              <span style={sectionDot}>●</span>
              <h2 style={sectionTitle}>WHY THIS MATTERS</h2>
            </div>
            <div>{renderStructuredText(enrichment.why_it_matters)}</div>
          </section>
        )}

        {/* WHAT HAPPENS NEXT */}
        {enrichment?.what_happens_next && (
          <section style={sectionBox}>
            <div style={sectionHeader}>
              <span style={sectionDot}>●</span>
              <h2 style={sectionTitle}>WHAT HAPPENS NEXT</h2>
              <span style={badgePredict}>FORECAST</span>
            </div>
            <div>{renderStructuredText(enrichment.what_happens_next)}</div>
          </section>
        )}

        {/* STRATEGIC ANALYSIS */}
        {enrichment?.ai_analysis && (
          <section style={sectionBox}>
            <div style={sectionHeader}>
              <span style={sectionDot}>●</span>
              <h2 style={sectionTitle}>STRATEGIC ANALYSIS</h2>
            </div>
            <p style={analysisText}>
              {enrichment.ai_analysis}
            </p>
          </section>
        )}

        {/* RE-ENRICH BUTTON (if old format) */}
        {!reEnrichClicked && enrichment && (
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <button onClick={triggerEnrich} style={{
              padding: "8px 16px",
              backgroundColor: "transparent",
              border: "1px solid #334155",
              color: "#64748B",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "inherit",
            }}>
              🔄 Regenerate AI Analysis
            </button>
          </div>
        )}

        {/* AFFECTED COMPANIES PLACEHOLDER */}
        <section style={sectionBox}>
          <div style={sectionHeader}>
            <span style={sectionDot}>●</span>
            <h2 style={sectionTitle}>AFFECTED COMPANIES</h2>
            <span style={badgeSoon}>V2.1</span>
          </div>
          <div style={{
            padding: "30px 20px",
            textAlign: "center",
            color: "#475569",
            fontSize: "13px",
            border: "1px dashed #1E293B",
            borderRadius: "6px",
          }}>
            <div style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.5 }}>💼</div>
            <div>Company impact analysis</div>
            <div style={{ fontSize: "11px", marginTop: "6px", color: "#334155" }}>
              Coming in MOD-021 — will show which companies are affected with exposure scores
            </div>
          </div>
        </section>

        {/* RELATED EVENTS */}
        {related.length > 0 && (
          <section style={sectionBox}>
            <div style={sectionHeader}>
              <span style={sectionDot}>●</span>
              <h2 style={sectionTitle}>RELATED EVENTS</h2>
              <span style={{ fontSize: "10px", color: "#64748B", marginLeft: "auto" }}>
                {related.length} found
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {related.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  onClick={() => router.push(`/event/${r.id}`)}
                  style={{
                    padding: "12px 14px",
                    backgroundColor: "rgba(10, 17, 32, 0.6)",
                    border: "1px solid #1E293B",
                    borderLeft: `3px solid ${getHeatColor(r.heat_score)}`,
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
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    marginBottom: "4px",
                  }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ 
                        fontSize: "13px", 
                        color: getHeatColor(r.heat_score), 
                        fontWeight: "bold",
                      }}>
                        {r.heat_score}
                      </span>
                      <span style={{ 
                        fontSize: "9px", 
                        color: "#64748B", 
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                      }}>
                        {r.category?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span style={{ fontSize: "10px", color: "#475569" }}>{r.source_name}</span>
                  </div>
                  <p style={{ 
                    fontSize: "13px", 
                    color: "#E2E8F0", 
                    margin: 0,
                    lineHeight: "1.4",
                  }}>{r.title}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ORIGINAL SOURCE */}
        <section style={sectionBox}>
          <div style={sectionHeader}>
            <span style={sectionDot}>●</span>
            <h2 style={sectionTitle}>ORIGINAL SOURCE</h2>
          </div>
          {event.url ? (
            <a href={event.url} target="_blank" rel="noreferrer" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: "#1E3A8A",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "1px",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2563EB"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#1E3A8A"}
            >
              READ ON {event.source_name?.toUpperCase()} →
            </a>
          ) : (
            <p style={{ color: "#64748B", fontSize: "13px" }}>No source URL available</p>
          )}
        </section>

      </main>

      <footer style={{
        borderTop: "1px solid #1E293B",
        padding: "24px",
        textAlign: "center",
        color: "#334155",
        fontSize: "10px",
        marginTop: "40px",
        letterSpacing: "1px",
      }}>
        DSRT WAE • Event Intelligence • LLaMA 3 via Groq • ID {event.id?.substring(0, 8)}
      </footer>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// === STYLES ===
const loadingStyle = {
  minHeight: "100vh",
  backgroundColor: "#030712",
  color: "#E2E8F0",
  padding: "40px",
  textAlign: "center",
  fontFamily: "'Courier New', monospace",
  paddingTop: "120px",
};

const btnStyle = {
  marginTop: "20px",
  padding: "10px 20px",
  backgroundColor: "#3B82F6",
  border: "none",
  color: "white",
  borderRadius: "6px",
  cursor: "pointer",
};

const headerStyle = {
  position: "sticky",
  top: 0,
  backgroundColor: "rgba(15, 23, 42, 0.95)",
  backdropFilter: "blur(8px)",
  borderBottom: "1px solid #1E293B",
  padding: "12px 24px",
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const backBtn = {
  background: "transparent",
  border: "1px solid #334155",
  color: "#94A3B8",
  padding: "6px 14px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "11px",
  fontFamily: "inherit",
  letterSpacing: "1px",
};

const btnSmall = {
  padding: "5px 10px",
  backgroundColor: "#0F172A",
  border: "1px solid #334155",
  color: "#94A3B8",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "10px",
  fontFamily: "inherit",
  letterSpacing: "1px",
};

const sectionBox = {
  marginBottom: "20px",
  padding: "20px 22px",
  backgroundColor: "#0a1120",
  border: "1px solid #1E293B",
  borderRadius: "8px",
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "16px",
  paddingBottom: "10px",
  borderBottom: "1px solid #1E293B",
};

const sectionDot = {
  color: "#4ADE80",
  fontSize: "10px",
};

const sectionTitle = {
  fontSize: "11px",
  letterSpacing: "3px",
  color: "#4ADE80",
  margin: 0,
  fontWeight: "bold",
};

const badgeReady = {
  marginLeft: "auto",
  fontSize: "9px",
  padding: "2px 8px",
  backgroundColor: "rgba(74, 222, 128, 0.15)",
  color: "#4ADE80",
  borderRadius: "3px",
  border: "1px solid rgba(74, 222, 128, 0.3)",
  letterSpacing: "1px",
  fontWeight: "bold",
};

const badgePredict = {
  marginLeft: "auto",
  fontSize: "9px",
  padding: "2px 8px",
  backgroundColor: "rgba(168, 85, 247, 0.15)",
  color: "#C084FC",
  borderRadius: "3px",
  border: "1px solid rgba(168, 85, 247, 0.3)",
  letterSpacing: "1px",
  fontWeight: "bold",
};

const badgeSoon = {
  marginLeft: "auto",
  fontSize: "9px",
  padding: "2px 8px",
  backgroundColor: "rgba(100, 116, 139, 0.15)",
  color: "#64748B",
  borderRadius: "3px",
  border: "1px solid rgba(100, 116, 139, 0.3)",
  letterSpacing: "1px",
  fontWeight: "bold",
};

const loadingBox = {
  padding: "16px",
  color: "#64748B",
  fontSize: "13px",
  fontStyle: "italic",
  backgroundColor: "rgba(15, 23, 42, 0.5)",
  border: "1px solid #1E293B",
  borderRadius: "6px",
};

const summaryText = {
  fontSize: "15px",
  lineHeight: "1.7",
  color: "#F1F5F9",
  margin: 0,
  fontWeight: "400",
};

const analysisText = {
  fontSize: "13.5px",
  lineHeight: "1.8",
  color: "#CBD5E1",
  margin: 0,
};

const countryTag = {
  display: "inline-block",
  padding: "3px 10px",
  fontSize: "10px",
  backgroundColor: "rgba(59, 130, 246, 0.1)",
  color: "#60A5FA",
  border: "1px solid rgba(59, 130, 246, 0.3)",
  borderRadius: "3px",
  letterSpacing: "1px",
  fontWeight: "bold",
};

const sourceTag = {
  display: "inline-block",
  padding: "3px 10px",
  fontSize: "10px",
  backgroundColor: "rgba(100, 116, 139, 0.1)",
  color: "#94A3B8",
  border: "1px solid rgba(100, 116, 139, 0.3)",
  borderRadius: "3px",
  letterSpacing: "1px",
};
