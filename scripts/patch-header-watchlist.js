import { readFileSync, writeFileSync } from "fs";

const file = "app/components/Header.jsx";
let content = readFileSync(file, "utf-8");

// Already has CompanySearch import? If not, leave it
// Just add a watchlist link in the right side

// Find the version badge area and add watchlist link before it
const oldVersionBadge = `<span style={{ 
            color: "#475569", fontSize: "10px",
            padding: "3px 8px",
            border: "1px solid #1E293B",
            borderRadius: "3px",
          }}>
            v2.0
          </span>`;

const newWithWatchlist = `<a 
            href="/watchlist"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              backgroundColor: "rgba(252, 211, 77, 0.1)",
              border: "1px solid #FCD34D44",
              color: "#FCD34D",
              borderRadius: "4px",
              textDecoration: "none",
              fontSize: "10px",
              letterSpacing: "1px",
              fontFamily: "inherit",
              fontWeight: "bold",
            }}
          >
            ⭐ WATCHLIST
          </a>
          
          <span style={{ 
            color: "#475569", fontSize: "10px",
            padding: "3px 8px",
            border: "1px solid #1E293B",
            borderRadius: "3px",
          }}>
            v2.1
          </span>`;

if (content.includes(oldVersionBadge)) {
  content = content.replace(oldVersionBadge, newWithWatchlist);
  writeFileSync(file, content);
  console.log("✓ Added Watchlist link to header");
} else {
  console.log("⚠ Header pattern not found, watchlist link may need manual add");
}
