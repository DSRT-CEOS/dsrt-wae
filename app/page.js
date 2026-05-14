"use client";

// ============================================
// DSRT WAE — MAIN DASHBOARD
// Connects to live API, auto-refreshes
// ============================================

import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import GlobalStats from "./components/GlobalStats";
import AIBriefing from "./components/AIBriefing";
import LiveFeed from "./components/LiveFeed";

const REFRESH_INTERVAL = 60000; // 60 seconds

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  // Fetch all data from API
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [eventsRes, statsRes, cycleRes] = await Promise.allSettled([
        fetch("/api/events?type=latest&limit=100"),
        fetch("/api/events?type=stats"),
        fetch("/api/events?type=cycle"),
      ]);

      if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
        const json = await eventsRes.value.json();
        setEvents(json.data || []);
      }

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const json = await statsRes.value.json();
        setStats(json.data || null);
      }

      if (cycleRes.status === "fulfilled" && cycleRes.value.ok) {
        const json = await cycleRes.value.json();
        setCycle(json.data || null);
      }

      setLastRefresh(new Date());
      setStatus("operational");
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#030712" }}>
      <Header
        lastRefresh={lastRefresh}
        status={status}
        onRefresh={fetchData}
      />

      <main style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "24px 20px",
      }}>
        {/* Loading state */}
        {loading && events.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "80px 20px",
          }}>
            <div style={{
              fontSize: "60px",
              animation: "spin 8s linear infinite",
              marginBottom: "20px",
            }}>
              🌍
            </div>
            <p style={{ color: "#94A3B8", fontSize: "14px" }}>
              Connecting to global intelligence network...
            </p>
            <p style={{ color: "#475569", fontSize: "11px", marginTop: "8px" }}>
              Loading real-time world data
            </p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{
            backgroundColor: "rgba(127, 29, 29, 0.3)",
            border: "1px solid #7F1D1D",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
            color: "#FCA5A5",
            fontSize: "13px",
          }}>
            ⚠️ System Error: {error}
          </div>
        )}

        {/* Empty state - no data yet */}
        {!loading && events.length === 0 && !error && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
          }}>
            <div style={{ fontSize: "50px", marginBottom: "16px" }}>📡</div>
            <h2 style={{ color: "#E2E8F0", fontSize: "16px", marginBottom: "8px" }}>
              No Events Yet
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "16px" }}>
              The engine hasn't run yet, or no events were collected.
            </p>
            <a
              href="/api/cron?secret=dsrt-wae-secret-2024"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                backgroundColor: "#3B82F6",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            >
              ⚡ Trigger Engine Cycle
            </a>
          </div>
        )}

        {/* Main content - has data */}
        {events.length > 0 && (
          <>
            <GlobalStats stats={stats} cycle={cycle} />
            <AIBriefing cycle={cycle} />
            <LiveFeed events={events} />
          </>
        )}
      </main>

      <footer style={{
        borderTop: "1px solid #1E293B",
        marginTop: "40px",
        padding: "20px",
        textAlign: "center",
        color: "#475569",
        fontSize: "11px",
      }}>
        <p style={{ margin: 0 }}>
          DSRT WAE v1.0 — Deep Strategic Real-Time World AI Engine
        </p>
        <p style={{ marginTop: "4px", margin: 0 }}>
          Sources: GDELT • 18 Global RSS Feeds • AI: LLaMA 3 via Groq
        </p>
      </footer>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes pulse-critical {
          0%, 100% { text-shadow: 0 0 0 rgba(255, 0, 0, 0); }
          50% { text-shadow: 0 0 12px rgba(255, 0, 0, 0.8); }
        }
      `}</style>
    </div>
  );
}
