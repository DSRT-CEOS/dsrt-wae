// ============================================
// YAHOO FINANCE FETCHER v1.1
// With crumb authentication for stats endpoint
// ============================================

import logger from "../../core/logger.js";

const MOD = "YAHOO";

export const MODULE_INFO = {
  id: "yahoo-finance",
  name: "Yahoo Finance Data Fetcher",
  version: "1.1.0",
};

// Auth state (cached across calls)
let crumb = null;
let cookieHeader = null;
let lastAuthAt = 0;
const AUTH_TTL = 60 * 60 * 1000; // refresh every hour

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

// ============================================
// AUTH: Get crumb + cookies from Yahoo
// ============================================
async function getCrumb() {
  // Use cached if still valid
  if (crumb && cookieHeader && (Date.now() - lastAuthAt) < AUTH_TTL) {
    return { crumb, cookieHeader };
  }

  try {
    // Step 1: Get cookies by visiting fc.yahoo.com
    const cookieRes = await fetchWithTimeout("https://fc.yahoo.com/", {});
    
    const setCookie = cookieRes.headers.get("set-cookie");
    if (!setCookie) {
      logger.warn(MOD, "No set-cookie header from Yahoo");
      // Try alternate cookie source
      const altRes = await fetchWithTimeout("https://finance.yahoo.com/", {});
      const altCookie = altRes.headers.get("set-cookie");
      if (altCookie) {
        cookieHeader = altCookie.split(",").map(c => c.split(";")[0]).join("; ");
      }
    } else {
      cookieHeader = setCookie.split(",").map(c => c.split(";")[0]).join("; ");
    }

    if (!cookieHeader) {
      logger.warn(MOD, "Could not get Yahoo cookies");
      return null;
    }

    // Step 2: Get crumb using cookies
    const crumbRes = await fetchWithTimeout(
      "https://query2.finance.yahoo.com/v1/test/getcrumb",
      {
        headers: { Cookie: cookieHeader },
      }
    );

    if (!crumbRes.ok) {
      logger.warn(MOD, `Crumb fetch failed: HTTP ${crumbRes.status}`);
      return null;
    }

    crumb = await crumbRes.text();
    
    if (!crumb || crumb.length < 5) {
      logger.warn(MOD, "Invalid crumb received");
      return null;
    }

    lastAuthAt = Date.now();
    logger.info(MOD, `Got Yahoo crumb: ${crumb.substring(0, 8)}...`);
    return { crumb, cookieHeader };
  } catch (err) {
    logger.error(MOD, `Auth failed: ${err.message}`);
    return null;
  }
}

// ============================================
// FETCH QUOTE (no auth needed)
// ============================================
export async function fetchQuote(ticker, exchange) {
  const yahooTicker = mapTicker(ticker, exchange);
  if (!yahooTicker) return null;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=1d`;
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
    
    return {
      ticker,
      yahoo_ticker: yahooTicker,
      price: meta.regularMarketPrice || null,
      currency: meta.currency || "USD",
      prev_close: meta.previousClose || meta.chartPreviousClose || null,
      change_amount: meta.regularMarketPrice && meta.previousClose 
        ? (meta.regularMarketPrice - meta.previousClose) : null,
      change_percent: meta.regularMarketPrice && meta.previousClose
        ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100) : null,
      open_price: quote?.open?.[0] || null,
      high_price: meta.regularMarketDayHigh || quote?.high?.[0] || null,
      low_price: meta.regularMarketDayLow || quote?.low?.[0] || null,
      volume: meta.regularMarketVolume || quote?.volume?.[0] || null,
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
// FETCH KEY STATS (with crumb auth)
// ============================================
export async function fetchKeyStats(ticker, exchange) {
  const yahooTicker = mapTicker(ticker, exchange);
  if (!yahooTicker) return null;

  const auth = await getCrumb();
  if (!auth) {
    logger.warn(MOD, `Stats ${yahooTicker}: no auth available`);
    return null;
  }

  try {
    const modules = "summaryDetail,defaultKeyStatistics,financialData,price,assetProfile";
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${yahooTicker}?modules=${modules}&crumb=${encodeURIComponent(auth.crumb)}`;
    
    const response = await fetchWithTimeout(url, {
      headers: { Cookie: auth.cookieHeader },
    });
    
    if (response.status === 401 || response.status === 403) {
      // Auth expired — refresh and retry once
      logger.info(MOD, `Auth expired for ${yahooTicker}, refreshing...`);
      crumb = null;
      cookieHeader = null;
      const newAuth = await getCrumb();
      if (!newAuth) return null;
      
      const retryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${yahooTicker}?modules=${modules}&crumb=${encodeURIComponent(newAuth.crumb)}`;
      const retryRes = await fetchWithTimeout(retryUrl, {
        headers: { Cookie: newAuth.cookieHeader },
      });
      
      if (!retryRes.ok) {
        logger.warn(MOD, `Stats ${yahooTicker} retry: HTTP ${retryRes.status}`);
        return null;
      }
      
      const data = await retryRes.json();
      return parseStats(data);
    }
    
    if (!response.ok) {
      logger.warn(MOD, `Stats ${yahooTicker}: HTTP ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return parseStats(data);
  } catch (err) {
    logger.error(MOD, `Stats ${yahooTicker} failed: ${err.message}`);
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
  
  const getValue = (obj) => obj?.raw ?? null;
  
  return {
    // Valuation
    market_cap_usd: getValue(price.marketCap),
    pe_ratio: getValue(summary.trailingPE),
    forward_pe: getValue(summary.forwardPE),
    eps: getValue(stats.trailingEps),
    forward_eps: getValue(stats.forwardEps),
    pb_ratio: getValue(stats.priceToBook),
    ps_ratio: getValue(summary.priceToSalesTrailing12Months),
    ev_ebitda: getValue(stats.enterpriseToEbitda),
    ev_revenue: getValue(stats.enterpriseToRevenue),
    peg_ratio: getValue(stats.pegRatio),
    
    // Dividend
    dividend_yield: getValue(summary.dividendYield),
    dividend_rate: getValue(summary.dividendRate),
    payout_ratio: getValue(summary.payoutRatio),
    
    // Margins
    profit_margin: getValue(fin.profitMargins),
    operating_margin: getValue(fin.operatingMargins),
    gross_margin: getValue(fin.grossMargins),
    ebitda_margin: getValue(fin.ebitdaMargins),
    
    // Growth
    revenue_growth: getValue(fin.revenueGrowth),
    earnings_growth: getValue(fin.earningsGrowth),
    
    // Returns
    roe: getValue(fin.returnOnEquity),
    roa: getValue(fin.returnOnAssets),
    
    // Financial health
    total_cash: getValue(fin.totalCash),
    total_debt: getValue(fin.totalDebt),
    debt_to_equity: getValue(fin.debtToEquity),
    current_ratio: getValue(fin.currentRatio),
    quick_ratio: getValue(fin.quickRatio),
    
    // Cash flow
    free_cash_flow: getValue(fin.freeCashflow),
    operating_cash_flow: getValue(fin.operatingCashflow),
    revenue: getValue(fin.totalRevenue),
    ebitda: getValue(fin.ebitda),
    
    // Shares
    shares_outstanding: getValue(stats.sharesOutstanding),
    float_shares: getValue(stats.floatShares),
    shares_short: getValue(stats.sharesShort),
    short_ratio: getValue(stats.shortRatio),
    short_percent_of_float: getValue(stats.shortPercentOfFloat),
    
    // Ownership
    held_percent_insiders: getValue(stats.heldPercentInsiders),
    held_percent_institutions: getValue(stats.heldPercentInstitutions),
    
    // Risk
    beta: getValue(stats.beta),
    
    // 52-week
    week_52_high: getValue(summary.fiftyTwoWeekHigh),
    week_52_low: getValue(summary.fiftyTwoWeekLow),
    week_52_change: getValue(stats["52WeekChange"]),
    
    // Analyst targets
    target_high: getValue(fin.targetHighPrice),
    target_low: getValue(fin.targetLowPrice),
    target_mean: getValue(fin.targetMeanPrice),
    target_median: getValue(fin.targetMedianPrice),
    recommendation_mean: getValue(fin.recommendationMean),
    recommendation_key: fin.recommendationKey,
    analyst_count: getValue(fin.numberOfAnalystOpinions),
    
    // Company profile extras
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

// ============================================
// FETCH HISTORICAL
// ============================================
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
      if (quote.close?.[i] != null) {
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
    logger.error(MOD, `Historical ${yahooTicker} failed: ${err.message}`);
    return [];
  }
}

export async function fetchCompanyData(ticker, exchange) {
  logger.info(MOD, `Fetching all data for ${ticker} (${exchange})...`);
  
  const [quote, stats, history] = await Promise.all([
    fetchQuote(ticker, exchange),
    fetchKeyStats(ticker, exchange),
    fetchHistorical(ticker, exchange, "1y"),
  ]);
  
  return { quote, stats, history };
}
