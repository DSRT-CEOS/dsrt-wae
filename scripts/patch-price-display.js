import { readFileSync, writeFileSync } from "fs";

const file = "app/company/[ticker]/page.js";
let content = readFileSync(file, "utf-8");

// Find the price display and fix it
const oldPrice = /\{price\?\.price && \([\s\S]*?<\/div>\s*\)\s*\}\s*<\/div>/;

// Actually, let's just add a formatPrice helper and use it directly
// First check if formatPrice is already added
if (!content.includes("const formatPrice =")) {
  // Add formatPrice function inside the component, after fmt definition
  content = content.replace(
    "const fmt = {",
    `const formatPrice = (n) => {
    if (n == null) return "—";
    if (n >= 1000) return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
    return n.toFixed(2);
  };

  const fmt = {`
  );
}

// Now replace the BIG price display in hero
const priceDisplay = `<span style={{ fontSize: "26px", fontWeight: "bold", color: "#F1F5F9" }}>
                      {fmt.money(price.price, currency).replace(/[A-Z]/g, "")}
                    </span>`;

const newPriceDisplay = `<span style={{ fontSize: "26px", fontWeight: "bold", color: "#F1F5F9" }}>
                      {currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "JPY" ? "¥" : "$"}{formatPrice(price.price)}
                    </span>`;

content = content.replace(priceDisplay, newPriceDisplay);

writeFileSync(file, content);
console.log("✓ Fixed header price display to show full price (no abbreviation)");
