import { readFileSync, writeFileSync } from "fs";

const files = ["app/global/page.js", "app/global/pulse/page.js"];

files.forEach(file => {
  try {
    let content = readFileSync(file, "utf-8");
    content = content.replace(/speed=\{70\}/g, "speed={120}");
    content = content.replace(/speed=\{75\}/g, "speed={130}");
    content = content.replace(/speed=\{80\}/g, "speed={140}");
    writeFileSync(file, content);
    console.log(`✓ Slowed tickers in ${file}`);
  } catch (err) {
    console.log(`Skipped ${file}: ${err.message}`);
  }
});
