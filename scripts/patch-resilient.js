import { readFileSync, writeFileSync } from "fs";

const file = "app/company/[ticker]/page.js";
let content = readFileSync(file, "utf-8");

// Make the load function more resilient with retries
const oldLoad = /useEffect\(\(\) => \{[\s\S]*?\}, \[ticker\]\);/;

const newLoad = `useEffect(() => {
    async function load(skipRefresh = false) {
      try {
        // Fire-and-forget refresh (don't block on it)
        if (!skipRefresh) {
          fetch(\`/api/company/\${ticker}/refresh\`, { 
            method: "POST" 
          }).catch(() => {});
        }
        
        // Fetch main data with retry logic
        let res;
        let attempt = 0;
        const maxAttempts = 3;
        
        while (attempt < maxAttempts) {
          try {
            res = await fetch(\`/api/company/\${ticker}\`);
            if (res.ok) break;
            attempt++;
            if (attempt < maxAttempts) {
              await new Promise(r => setTimeout(r, 1000));
            }
          } catch (fetchErr) {
            attempt++;
            if (attempt >= maxAttempts) throw fetchErr;
            await new Promise(r => setTimeout(r, 1000));
          }
        }
        
        if (!res || !res.ok) {
          throw new Error(\`HTTP \${res?.status || "unknown"}\`);
        }
        
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setError(null);
        } else {
          setError(json.error || "Unknown error");
        }
      } catch (err) {
        console.error("Load error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (ticker) {
      load();
      const interval = setInterval(() => load(false), 30000);
      return () => clearInterval(interval);
    }
  }, [ticker]);`;

content = content.replace(oldLoad, newLoad);

// Better error UI - show retry button instead of just "Back"
const oldErrorUI = /if \(error \|\| !data\) \{\s*return \(\s*<div style=\{loadingStyle\}>\s*<p>\{error \|\| "Company not found"\}<\/p>\s*<button onClick=\{\(\) => router\.push\("\/"\)\} style=\{btnStyle\}>Back<\/button>\s*<\/div>\s*\);\s*\}/;

const newErrorUI = `if (error || !data) {
    return (
      <div style={loadingStyle}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
        <p style={{ marginBottom: "8px" }}>{error || "Company not found"}</p>
        <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "20px" }}>
          Ticker: {ticker}
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button onClick={() => window.location.reload()} style={btnStyle}>
            🔄 Retry
          </button>
          <button onClick={() => router.push("/")} style={{ ...btnStyle, backgroundColor: "#1E293B" }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }`;

content = content.replace(oldErrorUI, newErrorUI);

writeFileSync(file, content);
console.log("✓ Made page more resilient with retries");
