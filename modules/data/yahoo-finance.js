// ============================================
// YAHOO FINANCE FETCHER v2.0 — BULLETPROOF
// ALWAYS uses chart data as source of truth
// Meta prices only used for supplementary info
// ============================================

import logger from "../../core/logger.js";

const MOD = "YAHOO";

export const MODULE_INFO = {
  id: "yahoo-finance",
  name: "Yahoo Finance Data Fetcher",
  version: "2.0.0",
};

let crumb = null;
let cookieHeader = null;
let lastAuthAt = 0;
const AUTH_TTL = 60 * 60 * 1000;

function mapTicker(ticker, exchange) {
  if (!ticker) return null;
  if (ticker.includes(".")) return ticker;
  switch (exchange) {
    case "NSE": return `${ticker}.NS`;
    case "BSE": return `${ticker}.BO`;
    case "LSE": return `${ticker}.L`;
    case "Xetra": return `${ticker}.DE`;
    case "Euronext": return `${ticker}.PA`;
    case "SIX": return `${ticker}.SW`;
    case "TSE": return `${ticker}.T`;
    case "KRX": return `${ticker}.KS`;
    case "HKEX": return `${ticker}.HK`;
    case "Tadawul": return `${ticker}.SR`;
    default: return ticker;
  }
}

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function getCrumb() {
  if (crumb && cookieHeader && (Date.now() - lastAuthAt) < AUTH_TTL) {
    return { crumb, cookieHeader };
  }

  try {
    const cookieRes = await fetchWithTimeout("https://fc.yahoo.com/", {});
    const setCookie = cookieRes.headers.get("set-cookie");
    
    if (!setCookie) {
      const altRes = await fetchWithTimeout("https://finance.yahoo.com/", {});
      const altCookie = altRes.headers.get("set-cookie");
      if (altCookie) {
        cookieHeader = altCookie.split(",").map(c => c.split(";")[0]).join("; ");
      }
    } else {
      cookieHeader = setCookie.split(",").map(c => c.split(";")[0]).join("; ");
    }

    if (!cookieHeader) return null;

    const crumbRes = await fetchWithTimeout(
      "https://query2.finance.yahoo.com/v1/test/getcrumb",
      { headers: { Cookie: cookieHeader } }
    );

    if (!crumbRes.ok) return null;
    crumb = await crumbRes.text();
    if (!crumb || crumb.length < 5) return null;

    lastAuthAt = Date.now();
    logger.info(MOD, `Got Yahoo crumb: ${crumb.substring(0, 8)}...`);
    return { crumb, cookieHeader };
  } catch (err) {
    return null;
  }
}

// ============================================
// FETCH QUOTE — CHART-FIRST APPROACH (bulletproof)
// ============================================
export async function fetchQuote(ticker, exchange) {
  const yahooTicker = mapTicker(ticker, exchange);
  if (!yahooTicker) return null;

  try {
    // Always fetch chart data - this is the source of truth
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=5d`;
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      logger.warn(MOD, `Quote ${yahooTicker}: HTTP ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    
    // CHART-FIRST: Use most recent valid close from chart indicators
    const closes = (quote?.close || []).filter(c => c != null && c > 0);
    const opens = (quote?.open || []).filter(c => c != null && c > 0);
    const highs = (quote?.high || []).filter(c => c != null && c > 0);
    const lows = (quote?.low || []).filter(c => c != null && c > 0);
    const volumes = (quote?.volume || []).filter(v => v != null && v > 0);
    
    if (closes.length === 0) {
      logger.warn(MOD, `${yahooTicker}: no valid closes in chart data`);
      return null;
    }
    
    // PRIMARY: Latest valid close from chart
    const chartPrice = closes[closes.length - 1];
    const chartPrevClose = closes.length >= 2 ? closes[closes.length - 2] : chartPrice;
    
    // SECONDARY: Meta price (only use if consistent with chart)
    const metaPrice = meta.regularMarketPrice;
    
    // DECISION: Always use chart unless meta is within 10% (proves it's reliable)
    let finalPrice = chartPrice;
    let finalPrevClose = chartPrevClose;
    
    if (metaPrice && metaPrice > 0) {
      const deviation = Math.abs(metaPrice - chartPrice) / chartPrice;
      if (deviation < 0.1) {
        // Meta is within 10% of chart - it's the current/intraday price
        finalPrice = metaPrice;
      } else {
        logger.warn(MOD, `${yahooTicker}: meta ${metaPrice} != chart ${chartPrice} (${(deviation * 100).toFixed(0)}% off), using chart`);
      }
    }
    
    // Validate prevClose too
    const metaPrevClose = meta.previousClose || meta.chartPreviousClose;
    if (metaPrevClose && metaPrevClose > 0) {
      const prevDev = Math.abs(metaPrevClose - chartPrice) / chartPrice;
      if (prevDev < 0.2) {
        finalPrevClose = metaPrevClose;
      }
    }
    
    const changeAmount = finalPrice - finalPrevClose;
    const changePercent = finalPrevClose !== 0 
      ? ((finalPrice - finalPrevClose) / finalPrevClose * 100) 
      : 0;
    
    // For day high/low/open: use meta if consistent, otherwise chart
    const validateAgainstPrice = (val, name) => {
      if (!val || val <= 0) return null;
      const dev = Math.abs(val - chartPrice) / chartPrice;
      if (dev > 0.3) {
        return null; // Reject suspicious values
      }
      return val;
    };
    
    return {
      ticker,
      yahoo_ticker: yahooTicker,
      price: finalPrice,
      currency: meta.currency || "USD",
      prev_close: finalPrevClose,
      change_amount: changeAmount,
      change_percent: changePercent,
      open_price: validateAgainstPrice(meta.regularMarketOpen, "open") || opens[opens.length - 1] || null,
      high_price: validateAgainstPrice(meta.regularMarketDayHigh, "high") || highs[highs.length - 1] || null,
      low_price: validateAgainstPrice(meta.regularMarketDayLow, "low") || lows[lows.length - 1] || null,
      volume: meta.regularMarketVolume || volumes[volumes.length - 1] || null,
      week_52_high: meta.fiftyTwoWeekHigh || null,
      week_52_low: meta.fiftyTwoWeekLow || null,
      market_cap_usd: null,
      exchange_name: meta.exchangeName || null,
      timezone: meta.timezone || null,
    };
  } catch (err) {
    logger.error(MOD, `Quote ${yahooTicker} failed: ${err.message}`);
    return null;
  }
}

// ============================================
// FETCH KEY STATS (same as before)
// ============================================
export async function fetchKeyStats(ticker, exchange) {
  const yahooTicker = mapTicker(ticker, exchange);
  if (!yahooTicker) return null;

  const auth = await getCrumb();
  if (!auth) return null;

  try {
    const modules = "summaryDetail,defaultKeyStatistics,financialData,price,assetProfile";
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${yahooTicker}?modules=${modules}&crumb=${encodeURIComponent(auth.crumb)}`;
    
    const response = await fetchWithTimeout(url, {
      headers: { Cookie: auth.cookieHeader },
    });
    
    if (response.status === 401 || response.status === 403) {
      crumb = null;
      cookieHeader = null;
      const newAuth = await getCrumb();
      if (!newAuth) return null;
      const retryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${yahooTicker}?modules=${modules}&crumb=${encodeURIComponent(newAuth.crumb)}`;
      const retryRes = await fetchWithTimeout(retryUrl, { headers: { Cookie: newAuth.cookieHeader } });
      if (!retryRes.ok) return null;
      const data = await retryRes.json();
      return parseStats(data);
    }
    
    if (!response.ok) return null;
    const data = await response.json();
    return parseStats(data);
  } catch (err) {
    return null;
  }
}

function parseStats(data) {
  const result = data?.quoteSummary?.result?.[0];
  if (!result) return null;
  
  const summary = result.summaryDetail || {};
  const stats = result.defaultKeyStatistics || {};
  const fin = result.financialData || {};
  const price = result.price || {};
  const profile = result.assetProfile || {};
  
  const v = (obj) => obj?.raw ?? null;
  
  return {
    market_cap_usd: v(price.marketCap),
    pe_ratio: v(summary.trailingPE),
    forward_pe: v(summary.forwardPE),
    eps: v(stats.trailingEps),
    forward_eps: v(stats.forwardEps),
    pb_ratio: v(stats.priceToBook),
    ps_ratio: v(summary.priceToSalesTrailing12Months),
    ev_ebitda: v(stats.enterpriseToEbitda),
    ev_revenue: v(stats.enterpriseToRevenue),
    peg_ratio: v(stats.pegRatio),
    dividend_yield: v(summary.dividendYield),
    dividend_rate: v(summary.dividendRate),
    payout_ratio: v(summary.payoutRatio),
    profit_margin: v(fin.profitMargins),
    operating_margin: v(fin.operatingMargins),
    gross_margin: v(fin.grossMargins),
    ebitda_margin: v(fin.ebitdaMargins),
    revenue_growth: v(fin.revenueGrowth),
    earnings_growth: v(fin.earningsGrowth),
    roe: v(fin.returnOnEquity),
    roa: v(fin.returnOnAssets),
    total_cash: v(fin.totalCash),
    total_debt: v(fin.totalDebt),
    debt_to_equity: v(fin.debtToEquity),
    current_ratio: v(fin.currentRatio),
    quick_ratio: v(fin.quickRatio),
    free_cash_flow: v(fin.freeCashflow),
    operating_cash_flow: v(fin.operatingCashflow),
    revenue: v(fin.totalRevenue),
    ebitda: v(fin.ebitda),
    shares_outstanding: v(stats.sharesOutstanding),
    float_shares: v(stats.floatShares),
    shares_short: v(stats.sharesShort),
    short_ratio: v(stats.shortRatio),
    short_percent_of_float: v(stats.shortPercentOfFloat),
    held_percent_insiders: v(stats.heldPercentInsiders),
    held_percent_institutions: v(stats.heldPercentInstitutions),
    beta: v(stats.beta),
    week_52_high: v(summary.fiftyTwoWeekHigh),
    week_52_low: v(summary.fiftyTwoWeekLow),
    week_52_change: v(stats["52WeekChange"]),
    target_high: v(fin.targetHighPrice),
    target_low: v(fin.targetLowPrice),
    target_mean: v(fin.targetMeanPrice),
    target_median: v(fin.targetMedianPrice),
    recommendation_mean: v(fin.recommendationMean),
    recommendation_key: fin.recommendationKey,
    analyst_count: v(fin.numberOfAnalystOpinions),
    full_time_employees: profile.fullTimeEmployees,
    long_business_summary: profile.longBusinessSummary,
    industry: profile.industry,
    sector: profile.sector,
    country: profile.country,
    city: profile.city,
    state: profile.state,
    website: profile.website,
  };
}

export async function fetchHistorical(ticker, exchange, period = "1y") {
  const yahooTicker = mapTicker(ticker, exchange);
  if (!yahooTicker) return [];

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=${period}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];
    
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const adjclose = result.indicators?.adjclose?.[0]?.adjclose || [];
    
    const bars = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.close?.[i] != null && quote.close[i] > 0) {
        bars.push({
          date: new Date(timestamps[i] * 1000).toISOString().split("T")[0],
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
          volume: quote.volume[i],
          adjusted_close: adjclose[i] ?? quote.close[i],
        });
      }
    }
    return bars;
  } catch (err) {
    return [];
  }
}

export async function fetchCompanyData(ticker, exchange) {
  const [quote, stats, history] = await Promise.all([
    fetchQuote(ticker, exchange),
    fetchKeyStats(ticker, exchange),
    fetchHistorical(ticker, exchange, "1y"),
  ]);
  return { quote, stats, history };
}
