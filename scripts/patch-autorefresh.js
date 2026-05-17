import { readFileSync, writeFileSync } from "fs";

const file = "app/company/[ticker]/page.js";
let content = readFileSync(file, "utf-8");

// Find the useEffect that loads data and add auto-refresh
const oldLoad = /useEffect\(\(\) => \{\s*async function load\(\) \{[\s\S]*?if \(ticker\) load\(\);\s*\}, \[ticker\]\);/;

const newLoad = `useEffect(() => {
    async function load(skipRefresh = false) {
      try {
        if (!skipRefresh) {
          // Fire and forget: trigger refresh in background
          fetch(\`/api/company/\${ticker}/refresh\`, { method: "POST" }).catch(() => {});
        }
        const res = await fetch(\`/api/company/\${ticker}\`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (ticker) {
      load();
      // Auto-refresh price every 30 seconds
      const interval = setInterval(() => {
        load(false);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [ticker]);`;

content = content.replace(oldLoad, newLoad);
writeFileSync(file, content);
console.log("✓ Added auto-refresh every 30 seconds");
