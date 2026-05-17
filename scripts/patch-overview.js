import { readFileSync, writeFileSync } from "fs";

const filePath = "app/company/[ticker]/page.js";
let content = readFileSync(filePath, "utf-8");

// Add PriceChart import at top
if (!content.includes("import PriceChart")) {
  content = content.replace(
    `import { useParams, useRouter } from "next/navigation";`,
    `import { useParams, useRouter } from "next/navigation";\nimport PriceChart from "../../components/PriceChart";`
  );
}

// Replace OverviewTab function
const oldOverview = /function OverviewTab\([^}]+}\) \{[\s\S]*?\n\}/;
const newOverview = `function OverviewTab({ company, price, financials, ratings, fmt, currency }) {
  return (
    <div>
      {/* PRICE CHART */}
      <section style={section}>
        <h2 style={sectionTitle}>● PRICE CHART</h2>
        <PriceChart ticker={company.ticker} currency={currency} />
      </section>

      {/* KEY METRICS GRID */}
      <section style={section}>
        <h2 style={sectionTitle}>● KEY METRICS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
          <MetricCard label="OPEN" value={fmt.money(price?.open_price, currency)} />
          <MetricCard label="DAY HIGH" value={fmt.money(price?.high_price, currency)} color="#4ADE80" />
          <MetricCard label="DAY LOW" value={fmt.money(price?.low_price, currency)} color="#FF8C42" />
          <MetricCard label="PREV CLOSE" value={fmt.money(price?.prev_close, currency)} />
          <MetricCard label="VOLUME" value={fmt.num(price?.volume, 0)} />
          <MetricCard label="52W HIGH" value={fmt.money(price?.week_52_high, currency)} color="#4ADE80" />
          <MetricCard label="52W LOW" value={fmt.money(price?.week_52_low, currency)} color="#FF8C42" />
          <MetricCard label="BETA" value={fmt.ratio(financials?.beta)} />
        </div>
      </section>

      {/* VALUATION */}
      <section style={section}>
        <h2 style={sectionTitle}>● VALUATION</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
          <MetricCard label="P/E TRAILING" value={fmt.ratio(financials?.pe_ratio || price?.pe_ratio)} />
          <MetricCard label="P/B RATIO" value={fmt.ratio(financials?.pb_ratio)} />
          <MetricCard label="P/S RATIO" value={fmt.ratio(financials?.ps_ratio)} />
          <MetricCard label="EV/EBITDA" value={fmt.ratio(financials?.ev_ebitda)} />
          <MetricCard label="EPS (TTM)" value={fmt.money(price?.eps, currency).replace(/[A-Z]/g, "")} />
          <MetricCard label="DIV YIELD" value={fmt.pctMult(price?.dividend_yield)} color="#4ADE80" />
        </div>
      </section>

      {/* PROFITABILITY */}
      <section style={section}>
        <h2 style={sectionTitle}>● PROFITABILITY</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
          <MetricCard label="GROSS MARGIN" value={fmt.pctMult(financials?.gross_margin)} color="#4ADE80" />
          <MetricCard label="OPERATING MARGIN" value={fmt.pctMult(financials?.operating_margin)} />
          <MetricCard label="NET MARGIN" value={fmt.pctMult(financials?.net_margin)} />
          <MetricCard label="ROE" value={fmt.pctMult(financials?.roe)} color="#60A5FA" />
        </div>
      </section>

      {/* BALANCE SHEET */}
      <section style={section}>
        <h2 style={sectionTitle}>● BALANCE SHEET</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
          <MetricCard label="CASH" value={fmt.money(financials?.cash_and_equivalents, currency)} color="#4ADE80" />
          <MetricCard label="TOTAL DEBT" value={fmt.money(financials?.total_debt, currency)} color="#FF8C42" />
          <MetricCard label="DEBT/EQUITY" value={fmt.ratio(financials?.debt_to_equity)} />
          <MetricCard label="CURRENT RATIO" value={fmt.ratio(financials?.current_ratio)} />
          <MetricCard label="FREE CASH FLOW" value={fmt.money(financials?.free_cash_flow, currency)} color="#4ADE80" />
          <MetricCard label="OPERATING CF" value={fmt.money(financials?.operating_cash_flow, currency)} />
        </div>
      </section>
    </div>
  );
}`;

content = content.replace(oldOverview, newOverview);
writeFileSync(filePath, content);
console.log("✓ Patched company page with PriceChart");
