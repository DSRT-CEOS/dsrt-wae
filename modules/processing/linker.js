// ============================================
// DSRT WAE — INTELLIGENCE LINKER (v2.2)
// Rate-limit aware + model rotation
// ============================================

import supabase from "../../database/client.js";
import logger from "../../core/logger.js";

const MOD = "LINKER-V2";

export const MODULE_INFO = {
  id: "intelligence-linker",
  name: "Intelligence Linker (LLM-powered)",
  version: "2.2.0",
};

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

// Rotate between models to distribute rate limit
const MODELS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
];
let modelIndex = 0;

// Global request tracking for rate limiting
let lastRequestTime = 0;
const MIN_GAP_MS = 2500; // 2.5 seconds between requests (~24/min, under 30/min limit)

let companyCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function loadCompanies() {
  const now = Date.now();
  if (companyCache && (now - cacheTimestamp) < CACHE_TTL) {
    return companyCache;
  }

  const { data } = await supabase
    .from("wae_companies")
    .select("id, ticker, name, aliases, sector, industry, country, description, market_cap_usd")
    .eq("is_active", true)
    .order("market_cap_usd", { ascending: false });

  companyCache = data || [];
  cacheTimestamp = now;
  logger.info(MOD, `Loaded ${companyCache.length} companies into cache`);
  return companyCache;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ========================================
// RATE-LIMITED GROQ CALL with model rotation
// ========================================

async function callGroq(prompt, retries = 3) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  // Enforce minimum gap between requests
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_GAP_MS) {
    await new Promise(r => setTimeout(r, MIN_GAP_MS - elapsed));
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    // Rotate models on each attempt
    const model = MODELS[modelIndex % MODELS.length];
    modelIndex++;
    
    lastRequestTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(GROQ_API, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are a senior geopolitical risk analyst. You analyze how events impact specific companies. You think about: direct exposure, supply chain effects, market exposure, regulatory risk, sector spillover. You ALWAYS find at least 2-5 affected companies from the candidates provided unless the event is purely abstract. Output valid JSON only.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 2500,
          response_format: { type: "json_object" },
        }),
      });

      clearTimeout(timeoutId);

      // Handle rate limit
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 8000;
        logger.warn(MOD, `Rate limited on ${model}, waiting ${waitMs}ms then retrying with next model...`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        logger.warn(MOD, `Groq error ${response.status}: ${errText.substring(0, 100)}`);
        // Try next model
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      try {
        return JSON.parse(content);
      } catch {
        // Sometimes model wraps JSON in markdown
        const cleaned = content.replace(/^```json\s*|\s*```$/g, '').trim();
        try {
          return JSON.parse(cleaned);
        } catch {
          logger.warn(MOD, `Failed to parse JSON from ${model}`);
          continue;
        }
      }
    } catch (err) {
      logger.error(MOD, `Groq error on ${model}: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return null;
}

// ========================================
// CANDIDATE SELECTION (same as v2.1)
// ========================================

function getCandidates(event, companies) {
  const fullText = [
    event.title || "",
    event.summary || "",
    event.content || "",
  ].join(" ").toLowerCase();

  const eventCountries = (event.countries || []).map(c => c.toLowerCase());
  const candidates = new Map();

  for (const company of companies) {
    if (candidates.has(company.id)) continue;
    
    if (company.ticker && fullText.includes(company.ticker.toLowerCase())) {
      const regex = new RegExp(`\\b${escapeRegex(company.ticker.toLowerCase())}\\b`);
      if (regex.test(fullText)) {
        candidates.set(company.id, { ...company, priority: 1, reason: "ticker" });
        continue;
      }
    }
    
    if (company.name && fullText.includes(company.name.toLowerCase())) {
      candidates.set(company.id, { ...company, priority: 1, reason: "name" });
      continue;
    }
    
    if (Array.isArray(company.aliases)) {
      for (const alias of company.aliases) {
        if (alias && alias.length >= 4 && fullText.includes(alias.toLowerCase())) {
          const regex = new RegExp(`\\b${escapeRegex(alias.toLowerCase())}\\b`);
          if (regex.test(fullText)) {
            candidates.set(company.id, { ...company, priority: 1, reason: "alias" });
            break;
          }
        }
      }
    }
  }

  for (const company of companies) {
    if (candidates.has(company.id)) continue;
    
    const companyCountryLower = (company.country || "").toLowerCase();
    if (!companyCountryLower) continue;
    
    const countryMentioned = eventCountries.some(c => 
      c === companyCountryLower || 
      companyCountryLower.includes(c) ||
      fullText.includes(companyCountryLower)
    );
    
    if (countryMentioned && company.market_cap_usd > 30000000000) {
      candidates.set(company.id, { ...company, priority: 2, reason: "country" });
    }
  }

  const categoryKeywords = {
    energy: ["oil", "gas", "opec", "crude", "petroleum", "energy", "pipeline", "lng", "barrel", "hormuz"],
    military: ["military", "weapons", "defense", "missile", "fighter", "jet", "tank", "warship", "submarine", "strike", "attack", "war"],
    technology: ["chip", "semiconductor", "ai", "artificial intelligence", "tech", "data", "cyber"],
    financial: ["bank", "trade", "tariff", "currency", "interest rate", "fed", "rbi", "market crash", "sanctions"],
    pharma: ["vaccine", "pandemic", "drug", "fda", "pharma", "medicine"],
  };

  const matchedSectors = new Set();
  
  if (categoryKeywords.energy.some(k => fullText.includes(k))) matchedSectors.add("Energy");
  if (categoryKeywords.military.some(k => fullText.includes(k))) matchedSectors.add("Industrials");
  if (categoryKeywords.technology.some(k => fullText.includes(k))) matchedSectors.add("Technology");
  if (categoryKeywords.financial.some(k => fullText.includes(k))) matchedSectors.add("Financials");
  if (categoryKeywords.pharma.some(k => fullText.includes(k))) matchedSectors.add("Healthcare");

  for (const sector of matchedSectors) {
    const sectorCompanies = companies
      .filter(c => c.sector === sector && !candidates.has(c.id))
      .slice(0, 5);
    
    for (const c of sectorCompanies) {
      candidates.set(c.id, { ...c, priority: 3, reason: `sector_${sector.toLowerCase()}` });
    }
  }

  return Array.from(candidates.values())
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 20);
}

async function expandViaRelationships(candidateIds, maxExpansion = 10) {
  if (candidateIds.length === 0) return [];
  
  const { data } = await supabase
    .from("wae_company_relationships")
    .select(`
      relationship_type, strength,
      company_a_data:wae_companies!company_a (id, ticker, name, sector, country, market_cap_usd, description),
      company_b_data:wae_companies!company_b (id, ticker, name, sector, country, market_cap_usd, description)
    `)
    .or(`company_a.in.(${candidateIds.join(",")}),company_b.in.(${candidateIds.join(",")})`)
    .order("strength", { ascending: false })
    .limit(20);
  
  const expanded = new Map();
  (data || []).forEach(rel => {
    const a = rel.company_a_data;
    const b = rel.company_b_data;
    if (a && !candidateIds.includes(a.id) && expanded.size < maxExpansion) {
      expanded.set(a.id, { ...a, reason: `${rel.relationship_type}` });
    }
    if (b && !candidateIds.includes(b.id) && expanded.size < maxExpansion) {
      expanded.set(b.id, { ...b, reason: `${rel.relationship_type}` });
    }
  });
  
  return Array.from(expanded.values());
}

async function llmAnalyze(event, candidates) {
  if (candidates.length === 0) return [];
  
  const candidateList = candidates.map((c, i) => 
    `${i+1}. ${c.ticker} | ${c.name} | ${c.sector} | ${c.country} | ${(c.description || "").substring(0, 100)}`
  ).join("\n");
  
  const prompt = `Analyze this geopolitical/economic event:

EVENT TITLE: ${event.title}
SUMMARY: ${event.summary || "N/A"}
REGION: ${event.region || "Global"}
COUNTRIES INVOLVED: ${(event.countries || []).join(", ") || "Not specified"}
HEAT/SEVERITY: ${event.heat_score}/10

CANDIDATE COMPANIES (pre-filtered for relevance):
${candidateList}

TASK: Identify which companies are GENUINELY affected. Think strategically:
1. DIRECT EXPOSURE - operations in affected region/sector
2. SUPPLY CHAIN - dependencies on entities involved
3. MARKET EXPOSURE - revenue from affected geography
4. SECTOR IMPACT - industry-wide effects
5. STRATEGIC SHIFT - competitive landscape changes
6. REGULATORY RISK - new rules/sanctions

RULES:
- Return AT LEAST 3 companies if event involves countries/sectors
- For energy events -> include oil companies even if not mentioned
- For Asia tensions -> include Asian companies + supply chain dependents
- For US-China events -> include both US tech AND Chinese tech
- For conflict -> include defense + regional energy
- Score 8+ for direct/critical, 5-7 for clear impact, 3-4 for indirect
- Skip 1-2 (too weak)

Return JSON TOP 8 most affected:
{
  "affected_companies": [
    {
      "ticker": "TSM",
      "impact_score": 9.2,
      "impact_channel": "direct",
      "reasoning": "Taiwan Semiconductor directly exposed to Taiwan Strait escalation, manufactures 60% of global advanced chips"
    }
  ]
}

impact_channel options: direct, supply_chain, market_exposure, regulatory, geopolitical, sector_shift

BE GENEROUS - investors need to see ALL exposed companies.`;

  const result = await callGroq(prompt);
  if (!result || !Array.isArray(result.affected_companies)) {
    return [];
  }
  
  return result.affected_companies;
}

export async function linkEvent(event) {
  const companies = await loadCompanies();
  if (companies.length === 0) return [];

  const candidates = getCandidates(event, companies);
  
  if (candidates.length === 0) {
    logger.debug(MOD, `No candidates for: ${event.title?.substring(0, 60)}`);
    return [];
  }
  
  const candidateIds = candidates.map(c => c.id);
  const expanded = await expandViaRelationships(candidateIds, 10);
  const allCandidates = [...candidates, ...expanded].slice(0, 30);
  
  logger.debug(MOD, `${event.id?.substring(0, 8)}: ${candidates.length}+${expanded.length}=${allCandidates.length}`);
  
  const llmResults = await llmAnalyze(event, allCandidates);
  
  if (llmResults.length === 0) {
    return [];
  }
  
  const links = [];
  for (const result of llmResults) {
    const company = allCandidates.find(c => c.ticker === result.ticker);
    if (!company) continue;
    
    const score = Math.min(10, Math.max(0, parseFloat(result.impact_score) || 5));
    const strength = score / 10;
    
    links.push({
      event_id: event.id,
      company_id: company.id,
      link_strength: parseFloat(strength.toFixed(2)),
      link_type: "llm_analysis",
      matched_alias: company.ticker,
      mention_count: 1,
      mentioned_in: ["llm_inferred"],
      impact_score: score,
      impact_channels: result.impact_channel ? [result.impact_channel] : null,
      llm_reasoning: result.reasoning,
      llm_score: score,
      analysis_method: "hybrid_llm_v2",
    });
  }
  
  if (links.length > 0) {
    const { error } = await supabase
      .from("wae_event_company_links")
      .upsert(links, {
        onConflict: "event_id,company_id",
        ignoreDuplicates: false,
      });
    
    if (error) {
      logger.error(MOD, `Insert failed: ${error.message}`);
      return [];
    }
  }
  
  return links;
}

export async function linkEvents(events) {
  if (!events || events.length === 0) return { linked: 0, totalLinks: 0 };

  logger.info(MOD, `Analyzing ${events.length} events with rate-limited LLM...`);
  logger.info(MOD, `Estimated time: ~${Math.ceil(events.length * 3 / 60)} minutes (1 event per ~3 sec)`);
  
  const startTime = Date.now();
  let totalLinks = 0;
  let eventsWithLinks = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const matches = await linkEvent(event);
    
    if (matches.length > 0) {
      eventsWithLinks++;
      totalLinks += matches.length;
    }
    
    if ((i + 1) % 5 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = ((eventsWithLinks / (i + 1)) * 100).toFixed(0);
      logger.info(MOD, `  Progress: ${i + 1}/${events.length} (${elapsed}s, ${eventsWithLinks} linked = ${rate}%)`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(
    MOD,
    `Done: ${eventsWithLinks}/${events.length} linked, ${totalLinks} total links in ${duration}s`
  );

  return { linked: eventsWithLinks, totalLinks, duration };
}

export function clearCache() {
  companyCache = null;
  cacheTimestamp = 0;
}
