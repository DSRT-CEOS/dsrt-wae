"use client";

// ============================================
// DSRT WAE — AI Briefing Component
// Displays LLM-generated intelligence brief
// ============================================

export default function AIBriefing({ cycle }) {
  const briefing = cycle?.ai_briefing || "";

  if (!briefing || briefing.length < 20) {
    return (
      <div style={{
        backgroundColor: "#0F172A",
        border: "1px solid #1E293B",
        borderRadius: "8px",
        padding: "24px",
        marginBottom: "24px",
      }}>
        <h2 style={{
          fontSize: "12px",
          letterSpacing: "3px",
          color: "#64748B",
          textTransform: "uppercase",
          margin: 0,
          marginBottom: "8px",
        }}>
          🤖 AI Strategic Briefing
        </h2>
        <p style={{ color: "#475569", fontSize: "13px", fontStyle: "italic" }}>
          Awaiting first analysis cycle...
        </p>
      </div>
    );
  }

  // Parse markdown-style briefing for nicer display
  const formatBriefing = (text) => {
    return text.split("\n").map((line, i) => {
      // Headers (## TITLE)
      if (line.startsWith("##")) {
        return (
          <h3 key={i} style={{
            color: "#4ADE80",
            fontSize: "13px",
            fontWeight: "bold",
            letterSpacing: "2px",
            marginTop: i === 0 ? 0 : "16px",
            marginBottom: "8px",
            textTransform: "uppercase",
          }}>
            {line.replace(/^##\s*/, "")}
          </h3>
        );
      }
      // Bullet points with emojis (🔴, 🟠, etc)
      if (/^[🔴🟠🟡🔵🟢]/.test(line.trim())) {
        return (
          <p key={i} style={{
            color: "#E2E8F0",
            fontSize: "13px",
            lineHeight: "1.6",
            marginBottom: "6px",
            paddingLeft: "8px",
          }}>
            {line}
          </p>
        );
      }
      // Bold (**text**)
      if (line.includes("**")) {
        const parts = line.split(/\*\*/);
        return (
          <p key={i} style={{
            color: "#CBD5E1",
            fontSize: "13px",
            lineHeight: "1.6",
            marginBottom: "8px",
          }}>
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} style={{ color: "#FCD34D" }}>{part}</strong>
              ) : (
                part
              )
            )}
          </p>
        );
      }
      // Normal paragraphs
      if (line.trim()) {
        return (
          <p key={i} style={{
            color: "#94A3B8",
            fontSize: "13px",
            lineHeight: "1.6",
            marginBottom: "8px",
          }}>
            {line}
          </p>
        );
      }
      return <br key={i} />;
    });
  };

  return (
    <div style={{
      backgroundColor: "#0F172A",
      border: "1px solid #166534",
      borderRadius: "8px",
      padding: "24px",
      marginBottom: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "1px solid #1E293B",
      }}>
        <h2 style={{
          fontSize: "12px",
          letterSpacing: "3px",
          color: "#4ADE80",
          textTransform: "uppercase",
          margin: 0,
        }}>
          🤖 AI Strategic Intelligence Briefing
        </h2>
        <span style={{ fontSize: "10px", color: "#475569" }}>
          {cycle?.started_at && new Date(cycle.started_at).toLocaleString()}
        </span>
      </div>

      {/* Content */}
      <div>
        {formatBriefing(briefing)}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: "16px",
        paddingTop: "12px",
        borderTop: "1px solid #1E293B",
        display: "flex",
        gap: "16px",
        fontSize: "10px",
        color: "#475569",
      }}>
        <span>📊 {cycle?.events_processed || 0} events analyzed</span>
        <span>📡 {cycle?.sources_hit?.length || 0} sources</span>
        <span>🌡️ Heat: {cycle?.global_heat_score || "—"}/10</span>
        <span>🤖 LLaMA 3 via Groq</span>
      </div>
    </div>
  );
}
