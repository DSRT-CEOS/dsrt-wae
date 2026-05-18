"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWatchlist } from "../hooks/useWatchlist";

export default function WatchlistPage() {
  const router = useRouter();
  const { 
    watchlists, 
    loading, 
    totalCompanies, 
    totalAlerts,
    removeFromWatchlist,
    createWatchlist,
    refresh,
  } = useWatchlist();
  
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [blink, setBlink] = useState(true);
  const [time, setTime] = useState(new Date());

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => setBlink(b => !b), 500);
    return () => clearInterval(interval);
  }, []);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fmt = {
    money: (n, currency = "USD") => {
      if (n == null) return "--";
      const sym = currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
      if (n >= 1000) return `${sym}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
      return `${sym}${n.toFixed(2)}`;
    },
    cap: (n) => {
      if (!n) return "--";
      if (n >= 1e12) return `${(n/1e12).toFixed(2)}T`;
      if (n >= 1e9) return `${(n/1e9).toFixed(1)}B`;
      if (n >= 1e6) return `${(n/1e6).toFixed(0)}M`;
      return n.toString();
    },
    pct: (n) => n == null ? "--" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`,
    chg: (n) => n == null ? "--" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}`,
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    await createWatchlist(newListName.trim());
    setNewListName("");
    setShowNewListForm(false);
  };

  const timeStr = time.toLocaleTimeString("en-US", { hour12: false });
  const dateStr = time.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#000000", 
      color: "#FF8800",
      fontFamily: "'Consolas', 'Courier New', monospace",
      fontSize: "12px",
      lineHeight: "1.4",
    }}>

      {/* TOP TERMINAL BAR */}
      <div style={{
        backgroundColor: "#FF8800",
        color: "#000000",
        padding: "4px 10px",
        fontSize: "11px",
        display: "flex",
        justifyContent: "space-between",
        fontWeight: "bold",
        letterSpacing: "1px",
      }}>
        <div>
          <span style={{ marginRight: "20px" }}>DSRT WAE TERMINAL</span>
          <span style={{ marginRight: "20px" }}>WL &lt;GO&gt;</span>
          <span>WATCHLIST MANAGER</span>
        </div>
        <div>
          <span style={{ marginRight: "20px" }}>{dateStr}</span>
          <span>{timeStr} IST</span>
        </div>
      </div>

      {/* COMMAND LINE */}
      <div style={{
        backgroundColor: "#111111",
        borderBottom: "1px solid #FF8800",
        padding: "6px 10px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <span style={{ color: "#FF8800", fontWeight: "bold" }}>&gt;</span>
        <span style={{ color: "#FFFFFF" }}>WL</span>
        <span style={{ color: "#FF8800" }}>{blink ? "_" : " "}</span>
        
        <div style={{ marginLeft: "auto", display: "flex", gap: "20px", fontSize: "11px" }}>
          <button onClick={() => router.push("/")} style={cmdBtn}>
            [F1] DASHBOARD
          </button>
          <button onClick={refresh} style={cmdBtn}>
            [F5] REFRESH
          </button>
          <button onClick={() => setShowNewListForm(true)} style={cmdBtn}>
            [F2] NEW LIST
          </button>
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{
        backgroundColor: "#000000",
        borderBottom: "1px solid #333333",
        padding: "8px 10px",
        display: "flex",
        gap: "30px",
        fontSize: "11px",
      }}>
        <StatusItem label="LISTS" value={watchlists.length} />
        <StatusItem label="TRACKED" value={totalCompanies} />
        <StatusItem label="ALERTS" value={totalAlerts} color={totalAlerts > 0 ? "#FF0000" : "#00FF00"} blinking={totalAlerts > 0} />
        <StatusItem label="STATUS" value="● LIVE" color="#00FF00" />
        <StatusItem label="REFRESH" value="60s AUTO" />
      </div>

      {/* NEW LIST FORM */}
      {showNewListForm && (
        <div style={{
          backgroundColor: "#1a0f00",
          borderBottom: "1px solid #FF8800",
          padding: "10px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}>
          <span style={{ color: "#FF8800" }}>NAME:</span>
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="TECH_STOCKS"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateList();
              if (e.key === "Escape") { setShowNewListForm(false); setNewListName(""); }
            }}
            autoFocus
            style={{
              flex: 1,
              padding: "4px 8px",
              backgroundColor: "#000000",
              border: "1px solid #FF8800",
              color: "#FFFFFF",
              fontFamily: "inherit",
              fontSize: "12px",
              outline: "none",
              textTransform: "uppercase",
            }}
          />
          <button onClick={handleCreateList} style={termBtnPrimary}>[ENTER] CREATE</button>
          <button onClick={() => { setShowNewListForm(false); setNewListName(""); }} style={termBtnSecondary}>[ESC] CANCEL</button>
        </div>
      )}

      {/* MAIN CONTENT */}
      {loading && watchlists.length === 0 ? (
        <div style={{ padding: "100px 20px", textAlign: "center", color: "#FF8800" }}>
          <div style={{ marginBottom: "10px" }}>LOADING WATCHLISTS{blink ? "..." : "   "}</div>
        </div>
      ) : watchlists.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "#666666" }}>
          <div style={{ color: "#FF8800", marginBottom: "10px", fontSize: "14px" }}>NO WATCHLISTS</div>
          <div style={{ fontSize: "11px", marginBottom: "20px" }}>
            Press [F2] to create new watchlist
          </div>
          <div style={{ fontSize: "11px" }}>
            Or go to any company page and click [+ WATCHLIST]
          </div>
        </div>
      ) : (
        watchlists.map(wl => (
          <WatchlistTable
            key={wl.id}
            watchlist={wl}
            fmt={fmt}
            onRowClick={(ticker) => router.push(`/company/${ticker}`)}
            onRemoveItem={(ticker) => {
              if (confirm(`REMOVE ${ticker.toUpperCase()} FROM ${wl.name.toUpperCase()}?`)) {
                removeFromWatchlist(ticker, wl.id);
              }
            }}
          />
        ))
      )}

      {/* FOOTER */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FF8800",
        color: "#000000",
        padding: "3px 10px",
        fontSize: "10px",
        fontWeight: "bold",
        display: "flex",
        justifyContent: "space-between",
        letterSpacing: "1px",
      }}>
        <div>DSRT WAE v2.1 | TERMINAL MODE</div>
        <div>POWERED BY DSRT INTELLIGENCE</div>
        <div>{timeStr}</div>
      </div>
    </div>
  );
}

function StatusItem({ label, value, color = "#FF8800", blinking = false }) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    if (!blinking) return;
    const t = setInterval(() => setVisible(v => !v), 500);
    return () => clearInterval(t);
  }, [blinking]);
  
  return (
    <div>
      <span style={{ color: "#666666" }}>{label}: </span>
      <span style={{ 
        color, 
        fontWeight: "bold",
        opacity: visible ? 1 : 0.3,
      }}>{value}</span>
    </div>
  );
}

function WatchlistTable({ watchlist, fmt, onRowClick, onRemoveItem }) {
  return (
    <div style={{ marginBottom: "1px" }}>
      {/* Watchlist title bar */}
      <div style={{
        backgroundColor: "#1a1a1a",
        borderTop: "1px solid #FF8800",
        borderBottom: "1px solid #333333",
        padding: "6px 10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#FF8800", fontWeight: "bold", letterSpacing: "1px", fontSize: "12px" }}>
            ● {watchlist.name.toUpperCase()}
          </span>
          <span style={{ color: "#666666", fontSize: "11px" }}>
            [{watchlist.item_count} ITEMS]
          </span>
        </div>
        
        {watchlist.items.some(i => i.active_events > 0) && (
          <span style={{ color: "#FF0000", fontSize: "11px", fontWeight: "bold" }}>
            ⚠ {watchlist.items.filter(i => i.active_events > 0).length} ALERTS ACTIVE
          </span>
        )}
      </div>

      {watchlist.items.length === 0 ? (
        <div style={{ 
          padding: "20px 10px", 
          color: "#666666", 
          fontSize: "11px",
          backgroundColor: "#000000",
        }}>
          (EMPTY - Add companies from their profile pages)
        </div>
      ) : (
        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse",
          backgroundColor: "#000000",
          fontSize: "11px",
        }}>
          <thead>
            <tr style={{ 
              backgroundColor: "#0a0a0a",
              borderBottom: "1px solid #333333",
              color: "#666666",
              fontSize: "10px",
              letterSpacing: "1px",
            }}>
              <th style={{ ...termTh, width: "80px" }}>TICKER</th>
              <th style={termTh}>SECURITY NAME</th>
              <th style={{ ...termTh, textAlign: "right", width: "100px" }}>LAST</th>
              <th style={{ ...termTh, textAlign: "right", width: "80px" }}>CHG</th>
              <th style={{ ...termTh, textAlign: "right", width: "80px" }}>CHG%</th>
              <th style={{ ...termTh, textAlign: "right", width: "80px" }}>MKT CAP</th>
              <th style={{ ...termTh, width: "100px" }}>SECTOR</th>
              <th style={{ ...termTh, width: "60px" }}>COUNTRY</th>
              <th style={{ ...termTh, textAlign: "center", width: "60px" }}>ALERT</th>
              <th style={{ ...termTh, textAlign: "center", width: "40px" }}>RMV</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.items.map((item, i) => {
              const change = item.price?.change_amount;
              const changePct = item.price?.change_percent;
              const changeColor = changePct >= 0 ? "#00FF00" : "#FF0000";
              const hasAlerts = item.active_events > 0;
              
              return (
                <tr 
                  key={item.id}
                  onClick={() => onRowClick(item.ticker)}
                  style={{ 
                    borderBottom: "1px solid #1a1a1a",
                    backgroundColor: hasAlerts 
                      ? "#1a0000" 
                      : (i % 2 === 0 ? "#000000" : "#0a0a0a"),
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#1a1a00";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = hasAlerts 
                      ? "#1a0000" 
                      : (i % 2 === 0 ? "#000000" : "#0a0a0a");
                  }}
                >
                  <td style={{ ...termTd, color: "#FFFFFF", fontWeight: "bold" }}>
                    {item.ticker}
                  </td>
                  <td style={{ ...termTd, color: "#CCCCCC" }}>
                    {item.company?.name?.substring(0, 35).toUpperCase() || "--"}
                  </td>
                  <td style={{ ...termTd, textAlign: "right", color: "#FFFFFF" }}>
                    {item.price ? fmt.money(item.price.price, item.price.currency) : "--"}
                  </td>
                  <td style={{ ...termTd, textAlign: "right", color: changeColor }}>
                    {fmt.chg(change)}
                  </td>
                  <td style={{ ...termTd, textAlign: "right", color: changeColor, fontWeight: "bold" }}>
                    {fmt.pct(changePct)}
                  </td>
                  <td style={{ ...termTd, textAlign: "right", color: "#FFAA00" }}>
                    {fmt.cap(item.company?.market_cap_usd)}
                  </td>
                  <td style={{ ...termTd, color: "#999999" }}>
                    {(item.company?.sector || "--").toUpperCase().substring(0, 15)}
                  </td>
                  <td style={{ ...termTd, color: "#999999" }}>
                    {(item.company?.country || "--").substring(0, 3).toUpperCase()}
                  </td>
                  <td style={{ ...termTd, textAlign: "center" }}>
                    {hasAlerts ? (
                      <span style={{
                        color: "#FF0000",
                        fontWeight: "bold",
                        animation: "blink 1s infinite",
                      }}>
                        ⚠ {item.active_events}
                      </span>
                    ) : (
                      <span style={{ color: "#333333" }}>--</span>
                    )}
                  </td>
                  <td style={{ ...termTd, textAlign: "center" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.ticker);
                      }}
                      style={{
                        padding: "2px 6px",
                        fontSize: "10px",
                        backgroundColor: "transparent",
                        border: "1px solid #FF0000",
                        color: "#FF0000",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      X
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const termTh = { 
  padding: "6px 8px", 
  textAlign: "left", 
  fontWeight: "normal",
  borderRight: "1px solid #1a1a1a",
};

const termTd = { 
  padding: "5px 8px", 
  textAlign: "left",
  borderRight: "1px solid #1a1a1a",
  fontFamily: "inherit",
  fontSize: "11px",
};

const cmdBtn = {
  background: "transparent",
  border: "none",
  color: "#FF8800",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "11px",
  letterSpacing: "1px",
  padding: "2px 8px",
};

const termBtnPrimary = {
  padding: "4px 12px",
  backgroundColor: "#FF8800",
  color: "#000000",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "11px",
  fontWeight: "bold",
  letterSpacing: "1px",
};

const termBtnSecondary = {
  padding: "4px 12px",
  backgroundColor: "transparent",
  color: "#FF8800",
  border: "1px solid #FF8800",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "11px",
  letterSpacing: "1px",
};

// Inject blinking animation
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `;
  if (!document.head.querySelector("style[data-blink]")) {
    style.setAttribute("data-blink", "true");
    document.head.appendChild(style);
  }
}
