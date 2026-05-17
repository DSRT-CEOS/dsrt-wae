// ============================================
// DSRT GLOBAL — Article Generator v0.3
// Clean rewrite with all improvements baked in
// ============================================

import supabase from "../../database/client.js";
import logger from "../../core/logger.js";

const MOD = "GLOBAL-WRITER";
const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

let lastRequestTime = 0;
const MIN_GAP_MS = 2500;

const MODELS = [
  "llama-3.1-8b-instant",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
];
let modelIndex = 0;

// ============================================
// BANNED PHRASES — Auto-reject if any appear
// ============================================
const BANNED_PHRASES = [
  "stakes have never been higher",
  "stakes are high",
  "stakes could not be higher",
  "fragile balance of power",
  "delicate balance",
  "delicate tightrope",
  "balance is on the brink",
  "complex web",
  "intricate web",
  "tangled web",
  "ripple effects",
  "ripple effect",
  "knock-on effects",
  "in the years to come",
  "in the coming years",
  "in the days ahead",
  "for years to come",
  "the years ahead",
  "perfect storm",
  "uncharted waters",
  "uncharted territory",
  "unprecedented times",
  "geopolitical chess",
  "the world watches",
  "tensions escalate",
  "situation is precarious",
  "may become a focal point",
  "high-stakes",
  "revolutionary",
  "disruptive technology",
  "game-changing",
  "paradigm shift",
  "the next big thing",
  "groundbreaking",
  "to the moon",
  "diamond hands",
  "paper hands",
  "climate emergency",
  "ticking time bomb",
  "wake-up call",
  "point of no return",
  "in a world where",
  "in today's world",
  "more than ever before",
  "now more than ever",
  "needless to say",
  "it goes without saying",
  "at the end of the day",
  "many experts believe",
  "some analysts say",
  "sources suggest",
  "according to reports",
];

// ============================================
// HELPERS
// ============================================

function cleanArticleText(text) {
  if (!text) return text;
  return text
    .replace(/\\n\\n/g, "\n\n")
    .replace(/\\n/g, "\n")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/  +/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function detectBannedPhrases(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return BANNED_PHRASES.filter(p => lower.includes(p));
}

function detectExcessRepetition(text) {
  if (!text) return [];
  const words = text.toLowerCase().split(/\s+/);
  const phrases = new Map();
  for (let i = 0; i < words.length - 3; i++) {
    const phrase = words.slice(i, i + 4).join(" ");
    if (phrase.length < 20) continue;
    phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
  }
  const result = [];
  for (const [phrase, count] of phrases.entries()) {
    if (count >= 3) result.push(phrase);
  }
  return result;
}

function countSpecificNumbers(text) {
  if (!text) return 0;
  // Match: percentages, dollar amounts, units, years, large numbers
  const patterns = [
    /\d+(?:\.\d+)?\s*%/g,
    /\$\s*\d+(?:\.\d+)?\s*(?:billion|million|trillion|B|M|T)?/gi,
    /\d{4}/g,                            // years
    /\d+(?:,\d{3})+/g,                   // 1,000 etc
    /\d+(?:\.\d+)?\s*(?:bps|kg|km|MMBtu|GW|MW|barrels|tons|tonnes)/gi,
  ];
  let count = 0;
  patterns.forEach(p => {
    const matches = text.match(p) || [];
    count += matches.length;
  });
  return count;
}

async function callGroq(systemPrompt, userPrompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const elapsed = Date.now() - lastRequestTime;
  if (elapsed < MIN_GAP_MS) {
    await new Promise(r => setTimeout(r, MIN_GAP_MS - elapsed));
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const model = MODELS[modelIndex % MODELS.length];
    modelIndex++;
    lastRequestTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch(GROQ_API, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.6,
          max_tokens: 2500,
          response_format: { type: "json_object" },
        }),
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 6000));
        continue;
      }

      if (!response.ok) {
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) continue;

      try {
        return JSON.parse(content);
      } catch {
        const cleaned = content.replace(/^```json\s*|\s*```$/g, "").trim();
        try {
          return JSON.parse(cleaned);
        } catch {
          continue;
        }
      }
    } catch (err) {
      logger.error(MOD, `Attempt ${attempt + 1} error: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return null;
}

function pickAgent(event) {
  const cat = (event.category || "").toLowerCase();
  const region = (event.region || "").toLowerCase();

  if (cat.includes("conflict") || cat.includes("military") || cat.includes("diplomacy")) {
    return "geopolitik";
  }
  if (cat.includes("economy") || cat.includes("monetary")) {
    return "macro_mike";
  }
  if (cat.includes("energy")) {
    return "energy_hawk";
  }
  if (cat.includes("tech")) {
    return "tech_skeptic";
  }
  if (cat.includes("climate") || cat.includes("environment")) {
    return "climate_watch";
  }
  if (region.includes("india") || (event.countries || []).includes("India")) {
    return "bharat_beat";
  }
  return "editorial";
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
}

async function recentSimilarExists(event) {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("dsrt_articles")
    .select("id")
    .eq("triggering_event_id", event.id)
    .gte("created_at", sixHoursAgo)
    .limit(1);
  return (data || []).length > 0;
}

async function buildContext(event) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: related } = await supabase
    .from("wae_events")
    .select("title, summary, heat_score, published_at")
    .or(`category.eq.${event.category},region.eq.${event.region}`)
    .neq("id", event.id)
    .gte("ingested_at", oneDayAgo)
    .order("heat_score", { ascending: false })
    .limit(5);

  const { data: links } = await supabase
    .from("wae_event_company_links")
    .select(`
      impact_score, impact_channels, llm_reasoning,
      wae_companies (ticker, name, sector, country)
    `)
    .eq("event_id", event.id)
    .gte("impact_score", 7)
    .order("impact_score", { ascending: false })
    .limit(5);

  return {
    event,
    relatedEvents: related || [],
    affectedCompanies: (links || [])
      .filter(l => l.wae_companies)
      .map(l => ({
        ticker: l.wae_companies.ticker,
        name: l.wae_companies.name,
        sector: l.wae_companies.sector,
        country: l.wae_companies.country,
        impact_score: l.impact_score,
        reasoning: l.llm_reasoning,
        channels: l.impact_channels,
      })),
  };
}

// ============================================
// MAIN: generateArticle
// ============================================

export async function generateArticle(event) {
  logger.info(MOD, `Generating: ${event.title?.substring(0, 60)}`);

  if (await recentSimilarExists(event)) {
    return { rejected: true, reason: "Similar article exists in last 6h" };
  }

  const context = await buildContext(event);
  const agentId = pickAgent(event);

  const { data: agent } = await supabase
    .from("dsrt_agents")
    .select("*")
    .eq("id", agentId)
    .single();

  if (!agent) {
    logger.error(MOD, `Agent ${agentId} not found`);
    return null;
  }

  const userPrompt = `Generate an analytical article for DSRT Global based on this event.

EVENT:
Title: ${event.title}
Summary: ${event.summary || "N/A"}
Category: ${event.category}
Region: ${event.region}
Countries: ${(event.countries || []).join(", ") || "Not specified"}
Heat Score: ${event.heat_score}/10
Published: ${event.published_at}

RELATED RECENT EVENTS (last 24h):
${context.relatedEvents.length === 0 ? "(none)" :
    context.relatedEvents.map((e, i) => `${i + 1}. [Heat ${e.heat_score}] ${e.title}`).join("\n")}

DIRECTLY AFFECTED COMPANIES (only strong links):
${context.affectedCompanies.length === 0 ? "(none — do not speculate about company impacts)" :
    context.affectedCompanies.map(c =>
      `- ${c.ticker} (${c.name}, ${c.sector}, ${c.country}): impact ${c.impact_score}/10 — ${c.reasoning}`
    ).join("\n")}

WRITING INSTRUCTIONS:
${agent.writing_style_guide}

CRITICAL RULES:
1. DO NOT cite sources or mention "according to reports".
2. DO NOT mention WAE event IDs or internal data systems.
3. DO NOT speculate about company impacts beyond what's listed above.
4. BE CONSERVATIVE: Use "may", "could", "suggests" — not "will", "definitely".
5. NO sensationalism. Reuters editorial standards.
6. Length: 500-650 words.
7. Provide useful analysis, not just news rehash.

MANDATORY SPECIFICITY (article will be REJECTED if missing):
- AT LEAST 4 specific numbers (dollar amounts, percentages, dates, quantities)
- AT LEAST 1 specific person named (official, executive, analyst) with title
- AT LEAST 1 specific document/treaty/regulation/filing by name and year
- AT LEAST 1 specific geographic location beyond country level (city, port, facility)
- ONE concrete indicator to watch (specific event, date, or threshold)

BANNED PHRASES (article will be REJECTED if any used):
"stakes are high", "stakes have never been higher", "fragile balance", "complex web",
"ripple effects", "in the years to come", "perfect storm", "uncharted waters",
"geopolitical chess", "tensions escalate", "high-stakes", "revolutionary",
"game-changing", "paradigm shift", "in a world where", "now more than ever",
"according to reports", "many experts believe", "sources suggest"

ALSO BANNED:
- Lazy historical parallels (no Cold War, Great Game, 1989 Bush-Deng, 1973 Arab-Israeli unless EXACT match)
- Generic conclusions that restate the lead
- Vague predictions without specific thresholds

Return JSON with this exact structure:
{
  "title": "Sharp factual title (max 12 words)",
  "subtitle": "One-sentence amplifier (max 25 words)",
  "lead_paragraph": "First paragraph that hooks reader (60-80 words)",
  "body_markdown": "Full article in markdown. Use ## for sections. 400-550 words excluding lead.",
  "summary_short": "One-sentence summary for cards (max 20 words)",
  "keywords": ["array", "of", "5-8", "keywords"],
  "meta_description": "SEO description (150-160 chars)",
  "category": "one of: geopolitics, economy, tech, energy, climate, markets, defense, science, culture, society",
  "tags": ["array", "of", "3-5", "tags"],
  "confidence": 0.85,
  "quality_self_assessment": 8.5
}`;

  const startTime = Date.now();
  const result = await callGroq(agent.system_prompt, userPrompt);
  const generationTime = ((Date.now() - startTime) / 1000).toFixed(1);

  if (!result || !result.title || !result.body_markdown) {
    logger.warn(MOD, "Generation failed");
    return null;
  }

  // Clean text
  result.body_markdown = cleanArticleText(result.body_markdown);
  result.lead_paragraph = cleanArticleText(result.lead_paragraph);

  // Quality gates
  const fullText = `${result.title} ${result.lead_paragraph} ${result.body_markdown}`;

  // Check 1: banned phrases
  const bannedFound = detectBannedPhrases(fullText);
  if (bannedFound.length > 0) {
    const reason = `Banned phrases: ${bannedFound.join(", ")}`;
    logger.warn(MOD, `Rejected — ${reason}`);
    return { rejected: true, reason };
  }

  // Check 2: repetition
  const repetitions = detectExcessRepetition(result.body_markdown);
  if (repetitions.length > 2) {
    const reason = `Repetitive: ${repetitions.slice(0, 2).join(", ")}`;
    logger.warn(MOD, `Rejected — ${reason}`);
    return { rejected: true, reason };
  }

  // Check 3: vagueness (number count)
  const numberCount = countSpecificNumbers(result.body_markdown);
  if (numberCount < 3) {
    const reason = `Too vague (only ${numberCount} specific numbers)`;
    logger.warn(MOD, `Rejected — ${reason}`);
    return { rejected: true, reason };
  }

  // Check 4: confidence + quality
  const confidence = parseFloat(result.confidence) || 0;
  const quality = parseFloat(result.quality_self_assessment) || 0;

  if (confidence < 0.75) {
    logger.warn(MOD, `Rejected — low confidence ${confidence}`);
    return { rejected: true, reason: `Low confidence: ${confidence}` };
  }

  if (quality < 7) {
    logger.warn(MOD, `Rejected — low quality ${quality}`);
    return { rejected: true, reason: `Low quality: ${quality}` };
  }

  // Build slug
  const baseSlug = slugify(result.title);
  const slug = `${baseSlug}-${event.id.substring(0, 8)}`;

  // Reading time
  const wordCount = (result.body_markdown.match(/\S+/g) || []).length;
  const readingTime = Math.ceil(wordCount / 220);

  // Save
  const articleRecord = {
    slug,
    title: result.title,
    subtitle: result.subtitle,
    lead_paragraph: result.lead_paragraph,
    body_markdown: result.body_markdown,
    summary_short: result.summary_short,
    article_type: event.heat_score >= 8 ? "breaking" : "analysis",
    category: result.category || event.category,
    region: event.region,
    countries: event.countries,
    tags: result.tags || [],
    triggering_event_id: event.id,
    related_event_ids: context.relatedEvents.map(e => e.id).filter(Boolean),
    mentioned_company_ids: context.affectedCompanies.map(c => c.id).filter(Boolean),
    source_urls: event.url ? [event.url] : [],
    agent_persona: agentId,
    llm_model: MODELS[(modelIndex - 1) % MODELS.length],
    generation_seconds: parseFloat(generationTime),
    quality_score: quality,
    confidence_score: confidence,
    meta_description: result.meta_description,
    keywords: result.keywords || [],
    reading_time_minutes: readingTime,
    status: "published",
    published_at: new Date().toISOString(),
  };

  const { data: saved, error } = await supabase
    .from("dsrt_articles")
    .insert(articleRecord)
    .select()
    .single();

  if (error) {
    logger.error(MOD, `Save failed: ${error.message}`);
    return null;
  }

  // Update agent stats
  await supabase
    .from("dsrt_agents")
    .update({
      articles_written: (agent.articles_written || 0) + 1,
      avg_quality_score: agent.avg_quality_score
        ? (parseFloat(agent.avg_quality_score) + quality) / 2
        : quality,
    })
    .eq("id", agentId);

  logger.info(MOD, `Published: ${result.title.substring(0, 60)} [${agentId}, Q=${quality}]`);
  return saved;
}

// ============================================
// BATCH
// ============================================

export async function generateBatch(events, maxArticles = 5) {
  if (!events || events.length === 0) return { generated: 0, rejected: 0 };

  logger.info(MOD, `Batch: up to ${maxArticles} from ${events.length} events`);
  const startTime = Date.now();

  let generated = 0;
  let rejected = 0;

  const sorted = [...events].sort((a, b) => b.heat_score - a.heat_score);

  for (const event of sorted) {
    if (generated >= maxArticles) break;
    if (Date.now() - startTime > 50000) {
      logger.warn(MOD, "Time budget approaching, stopping");
      break;
    }

    const result = await generateArticle(event);
    if (result?.rejected) {
      rejected++;
    } else if (result?.id) {
      generated++;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(MOD, `Batch done: ${generated} published, ${rejected} rejected in ${duration}s`);

  return { generated, rejected, duration };
}
