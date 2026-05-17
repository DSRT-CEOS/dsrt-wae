import { readFileSync, writeFileSync } from "fs";

const file = "app/api/company/[ticker]/refresh/route.js";
let content = readFileSync(file, "utf-8");

// Wrap the fetchQuote in try/catch so failures don't 500 the whole thing
const oldFetch = "const quote = await fetchQuote(company.ticker, company.exchange);";
const newFetch = `let quote = null;
    try {
      quote = await fetchQuote(company.ticker, company.exchange);
    } catch (fetchErr) {
      console.error("[REFRESH] Yahoo fetch error for", company.ticker, fetchErr.message);
    }`;

if (content.includes(oldFetch)) {
  content = content.replace(oldFetch, newFetch);
  writeFileSync(file, content);
  console.log("✓ Made refresh endpoint resilient to Yahoo failures");
} else {
  console.log("Already patched or pattern not found");
}
