import { readFileSync, writeFileSync } from "fs";

const file = "app/company/[ticker]/page.js";
let content = readFileSync(file, "utf-8");

// Add fmt.timeAgo helper if not present
if (!content.includes("timeAgo:")) {
  content = content.replace(
    `ratio: (n) => n == null ? "—" : n.toFixed(2),`,
    `ratio: (n) => n == null ? "—" : n.toFixed(2),
    timeAgo: (date) => {
      if (!date) return "never";
      const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return mins + "m ago";
      if (mins < 1440) return Math.floor(mins / 60) + "h ago";
      return Math.floor(mins / 1440) + "d ago";
    },`
  );
}

// Add live indicator to price display
const oldPriceDisplay = /\{price\?\.price && \(\s*<div style=\{\{ display: "flex", alignItems: "baseline", gap: "10px" \}\}>/;

if (oldPriceDisplay.test(content)) {
  content = content.replace(
    oldPriceDisplay,
    `{price?.price && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>`
  );
}

// Add freshness badge after change_percent display
const changeEnd = /\(\{fmt\.money\(price\.change_amount, currency\)\}\)\s*<\/span>\s*<\/div>\s*\)\}/;
content = content.replace(
  changeEnd,
  `({fmt.money(price.change_amount, currency)})
                    </span>
                    {price?.fetched_at && (
                      <span style={{ 
                        fontSize: "10px", 
                        color: "#64748B",
                        padding: "2px 8px",
                        backgroundColor: "rgba(74, 222, 128, 0.1)",
                        border: "1px solid rgba(74, 222, 128, 0.3)",
                        borderRadius: "3px",
                        letterSpacing: "1px"
                      }}>
                        ● LIVE · {fmt.timeAgo(price.fetched_at)}
                      </span>
                    )}
                  </div>
                )}`
);

writeFileSync(file, content);
console.log("✓ Added live freshness indicator to company page");
