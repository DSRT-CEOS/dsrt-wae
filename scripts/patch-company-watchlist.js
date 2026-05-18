import { readFileSync, writeFileSync } from "fs";

const file = "app/company/[ticker]/page.js";
let content = readFileSync(file, "utf-8");

// Add import
if (!content.includes("import WatchlistButton")) {
  content = content.replace(
    `import { useParams, useRouter } from "next/navigation";`,
    `import { useParams, useRouter } from "next/navigation";\nimport WatchlistButton from "../../components/WatchlistButton";`
  );
}

// Add WatchlistButton next to the tags. Find the source tag div and add after it.
// Look for the closing of the country/source tags section and add WatchlistButton
const oldTags = `{event.source_name && (\n                <span style={{ ...tag, color: "#60A5FA", borderColor: "#1E40AF" }}>\n                  via {event.source_name}\n                </span>\n              )}\n            </div>`;

// Hmm, this is for event page not company. Let me look for company page pattern instead
// The company page has tags too. Find a unique pattern.

// Find the buttons section in company header
const oldButtons = `<button style={btnSmall}>+ WATCHLIST</button>
            <button style={btnSmall}>🔔 ALERT</button>
            <button style={btnSmall}>📥 EXPORT</button>`;

if (content.includes(oldButtons)) {
  content = content.replace(
    oldButtons,
    `<WatchlistButton ticker={company.ticker} size="default" />
            <button style={btnSmall}>🔔 ALERT</button>
            <button style={btnSmall}>📥 EXPORT</button>`
  );
  console.log("✓ Replaced + WATCHLIST button with functional WatchlistButton");
} else {
  // Try different button text
  const altButtons = `<button style={btnSmall}>WATCHLIST</button>
            <button style={btnSmall}>ALERT</button>
            <button style={btnSmall}>EXPORT</button>`;
  
  if (content.includes(altButtons)) {
    content = content.replace(
      altButtons,
      `<WatchlistButton ticker={company.ticker} size="default" />
            <button style={btnSmall}>ALERT</button>
            <button style={btnSmall}>EXPORT</button>`
    );
    console.log("✓ Replaced WATCHLIST button with functional WatchlistButton");
  } else {
    console.log("⚠ Button pattern not found — you may need to manually add <WatchlistButton ticker={company.ticker} />");
  }
}

writeFileSync(file, content);
