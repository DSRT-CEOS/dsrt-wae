import { readFileSync, writeFileSync } from "fs";

const file = "app/components/Header.jsx";
let content = readFileSync(file, "utf-8");

// Add Global link near watchlist link
const oldWatchlist = `<a 
            href="/watchlist"`;

const newWithGlobal = `<a 
            href="/global"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "1px solid #3B82F644",
              color: "#60A5FA",
              borderRadius: "4px",
              textDecoration: "none",
              fontSize: "10px",
              letterSpacing: "1px",
              fontFamily: "inherit",
              fontWeight: "bold",
            }}
          >
            🌐 DSRT GLOBAL
          </a>
          
          <a 
            href="/watchlist"`;

if (content.includes(oldWatchlist) && !content.includes("DSRT GLOBAL")) {
  content = content.replace(oldWatchlist, newWithGlobal);
  writeFileSync(file, content);
  console.log("✓ Added DSRT GLOBAL link to dashboard header");
} else if (content.includes("DSRT GLOBAL")) {
  console.log("Already linked");
} else {
  console.log("Pattern not found — manually add link to header");
}
