import { readFileSync, writeFileSync } from "fs";

const file = "modules/data/yahoo-finance.js";
let content = readFileSync(file, "utf-8");

// Update fetchQuote to validate against chart data
const oldFetchQuote = /export async function fetchQuote\(ticker, exchange\) \{[\s\S]*?return \{[\s\S]*?\};\s*\} catch \(err\) \{[\s\S]*?return null;\s*\}\s*\}/;

const newFetchQuote = `export async function fetchQuote(ticker, exchange) {
  const yahooTicker = mapTicker(ticker, exchange);
  if (!yahooTicker) return null;

  try {
    // Fetch 5 days of data so we have valid recent close prices
    const url = \`https://query1.finance.yahoo.com/v8/finance/chart/\${yahooTicker}?interval=1d&range=5d\`;
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      logger.warn(MOD, \`Quote \${yahooTicker}: HTTP \${response.status}\`);
      return null;
    }
    
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    // Get the most recent valid close from chart data
    const closes = (quote?.close || []).filter(c => c != null && c > 0);
    const validCloses = closes.filter(c => c > 0);
    const lastValidClose = validCloses[validCloses.length - 1];
    const prevValidClose = validCloses[validCloses.length - 2];
    
    // VALIDATION: If meta.regularMarketPrice is suspiciously off from chart data,
    // use the chart's last valid close instead
    let price = meta.regularMarketPrice;
    let prevClose = meta.previousClose || meta.chartPreviousClose;
    
    if (lastValidClose && price) {
      // If meta price differs from chart by more than 50%, chart is more reliable
      const deviation = Math.abs(price - lastValidClose) / lastValidClose;
      if (deviation > 0.5) {
        logger.warn(MOD, \`\${yahooTicker}: meta price \${price} differs from chart \${lastValidClose} by \${(deviation * 100).toFixed(0)}%, using chart\`);
        price = lastValidClose;
        prevClose = prevValidClose || lastValidClose;
      }
    } else if (lastValidClose && !price) {
      // Meta price missing entirely
      price = lastValidClose;
      prevClose = prevValidClose || lastValidClose;
    }
    
    // Also validate prevClose
    if (prevClose && lastValidClose) {
      const prevDeviation = Math.abs(prevClose - lastValidClose) / lastValidClose;
      if (prevDeviation > 0.5) {
        prevClose = prevValidClose || lastValidClose;
      }
    }
    
    const changeAmount = price && prevClose ? (price - prevClose) : null;
    const changePercent = price && prevClose && prevClose !== 0
      ? ((price - prevClose) / prevClose * 100)
      : null;
    
    return {
      ticker,
      yahoo_ticker: yahooTicker,
      price: price || null,
      currency: meta.currency || "USD",
      prev_close: prevClose || null,
      change_amount: changeAmount,
      change_percent: changePercent,
      open_price: quote?.open?.filter(o => o != null).pop() || null,
      high_price: meta.regularMarketDayHigh || null,
      low_price: meta.regularMarketDayLow || null,
      volume: meta.regularMarketVolume || quote?.volume?.filter(v => v != null).pop() || null,
      week_52_high: meta.fiftyTwoWeekHigh || null,
      week_52_low: meta.fiftyTwoWeekLow || null,
      market_cap_usd: null,
      exchange_name: meta.exchangeName || null,
      timezone: meta.timezone || null,
    };
  } catch (err) {
    logger.error(MOD, \`Quote \${yahooTicker} failed: \${err.message}\`);
    return null;
  }
}`;

content = content.replace(oldFetchQuote, newFetchQuote);
writeFileSync(file, content);
console.log("✓ Fixed fetchQuote with price validation");
