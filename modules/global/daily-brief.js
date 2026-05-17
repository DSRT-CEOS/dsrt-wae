// ============================================
// DSRT GLOBAL — Daily Brief Generator v1.1
// Better fallback + multiple model rotation
// ============================================

import supabase from "../../database/client.js";
import logger from "../../core/logger.js";

const MOD = "DAILY-BRIEF";
const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

const MODELS = [
  "llama-3.1-8b-instant",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
];

async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.warn(MOD, "No GROQ_API_KEY");
    return null;
  }

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    logger.info(MOD, `Trying model: ${model}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

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
            {
              role: "system",
              content: "You are the editor-in-chief of DSRT Global, an AI-powered intelligence media platform. You write the morning Daily Brief — the most important 5 things readers should know about the world today. Tone: measured, intelligent, no sensationalism. Output ONLY valid JSON. No markdown wrapping. No explanations.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 3000,
          response_format: { type: "json_object" },
        }),
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        logger.warn(MOD, `Rate limit on ${model}, trying next`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        logger.warn(MOD, `${model} HTTP ${response.status}: ${errText.substring(0, 100)}`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        logger.warn(MOD, `${model} returned empty content`);
        continue;
      }

      try {
        const parsed = JSON.parse(content);
        logger.info(MOD, `✓ ${model} succeeded`);
        return parsed;
      } catch (parseErr) {
        // Try to clean and re-parse
        const cleaned = content.replace(/^```json\s*|\s*```$/g, '').trim();
        try {
          return JSON.parse(cleaned);
        } catch {
          logger.warn(MOD, `${model} returned invalid JSON`);
          continue;
        }
      }
    } catch (err) {
      logger.error(MOD, `${model} error: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return null;
}

export async function generateDailyBrief(forceRegenerate = false) {
  const today = new Date().toISOString().split("T")[0];
  
  // Check if today's brief already exists
  if (!forceRegenerate) {
    const { data: existing } = await supabase
      .from("dsrt_daily_briefs")
      .select("id, brief_date")
      .eq("brief_date", today)
      .maybeSingle();
    
    if (existing) {
      logger.info(MOD, `Today's brief already exists (${existing.id})`);
      return null;
    }
  } else {
    // Delete existing if forcing regenerate
    await supabase.from("dsrt_daily_briefs").delete().eq("brief_date", today);
  }
  
  // Get top events from last 24h
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: events } = await supabase
    .from("wae_events")
    .select("id, title, summary, heat_score, category, region, countries")
    .gte("ingested_at", yesterday)
    .gte("heat_score", 5)  // Lowered from 6 to ensure enough events
    .order("heat_score", { ascending: false })
    .limit(30);
  
  if (!events || events.length === 0) {
    logger.warn(MOD, "No events found in last 24h");
    return null;
  }
  
  logger.info(MOD, `Found ${events.length} events for brief`);
  
  // Calculate Global Heat Index
  const avgHeat = events.reduce((s, e) => s + e.heat_score, 0) / events.length;
  const globalHeat = parseFloat(avgHeat.toFixed(1));
  
  // Yesterday's index
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const { data: yesterdayBrief } = await supabase
    .from("dsrt_daily_briefs")
    .select("global_heat_index")
    .eq("brief_date", yesterdayDate)
    .maybeSingle();
  
  const heatChange = yesterdayBrief 
    ? parseFloat((globalHeat - parseFloat(yesterdayBrief.global_heat_index)).toFixed(1))
    : 0;
  
  // Regional breakdown
  const regionalHeat = {};
  const regionGroups = {};
  events.forEach(e => {
    const region = e.region || "Global";
    if (!regionGroups[region]) regionGroups[region] = [];
    regionGroups[region].push(e.heat_score);
  });
  Object.entries(regionGroups).forEach(([region, scores]) => {
    regionalHeat[region] = parseFloat(
      (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    );
  });
  
  // Threat level
  const threatLevel = 
    globalHeat >= 8 ? "CRITICAL" :
    globalHeat >= 7 ? "HIGH" :
    globalHeat >= 6 ? "ELEVATED" :
    globalHeat >= 5 ? "MODERATE" : "STABLE";
  
  // Generate via LLM
  const prompt = `Generate today's DSRT Brief — the morning intelligence briefing.

GLOBAL HEAT INDEX: ${globalHeat}/10 (${threatLevel})
HEAT CHANGE FROM YESTERDAY: ${heatChange >= 0 ? "+" : ""}${heatChange}

TOP EVENTS (last 24h, sorted by heat):
${events.slice(0, 15).map((e, i) => 
  `${i+1}. [Heat ${e.heat_score}] [${e.category}] [${e.region}] ${e.title}`
).join("\n")}

Generate the "5 Things You Need to Know" — select the 5 MOST IMPORTANT and DIVERSE events. Cover different categories/regions. Don't pick 5 events about the same topic.

Return ONLY this JSON structure (no other text):
{
  "five_things": [
    {
      "headline": "Sharp 8-12 word headline",
      "summary": "2-3 sentence summary (60-80 words)",
      "category": "geopolitics",
      "region": "Middle East",
      "why_it_matters": "1 sentence on significance"
    }
  ],
  "executive_summary": "2-3 sentence overall world state today",
  "watch_today": [
    {
      "time": "approximate time today",
      "event": "what to watch",
      "importance": "why it matters in 1 line"
    }
  ]
}

CRITICAL: five_things must have exactly 5 items. watch_today should have 3-5 items.`;
  
  const result = await callGroq(prompt);
  
  if (!result) {
    logger.warn(MOD, "All LLM attempts failed, generating fallback brief");
    return generateFallbackBrief(today, events, globalHeat, heatChange, threatLevel, regionalHeat);
  }
  
  if (!result.five_things || !Array.isArray(result.five_things) || result.five_things.length === 0) {
    logger.warn(MOD, "LLM returned invalid structure, using fallback");
    return generateFallbackBrief(today, events, globalHeat, heatChange, threatLevel, regionalHeat);
  }
  
  // Build markdown body
  let body = `# The DSRT Brief — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}\n\n`;
  body += `**WAE Global Heat Index: ${globalHeat} (${threatLevel}, ${heatChange >= 0 ? "↑" : "↓"} ${Math.abs(heatChange)})**\n\n`;
  
  if (result.executive_summary) {
    body += `${result.executive_summary}\n\n`;
  }
  
  body += `---\n\n## OVERNIGHT (while you slept):\n\n`;
  
  result.five_things.forEach((item, i) => {
    body += `### ${i + 1}. ${item.headline}\n\n`;
    body += `${item.summary}\n\n`;
    if (item.why_it_matters) {
      body += `**Why it matters:** ${item.why_it_matters}\n\n`;
    }
    body += `*${item.category || ""} · ${item.region || ""}*\n\n`;
  });
  
  if (result.watch_today && result.watch_today.length > 0) {
    body += `---\n\n## DSRT WATCH TODAY:\n\n`;
    result.watch_today.forEach(item => {
      body += `- **${item.time}** — ${item.event}\n  *${item.importance}*\n\n`;
    });
  }
  
  body += `---\n\n## GLOBAL HEAT BREAKDOWN:\n\n`;
  Object.entries(regionalHeat)
    .sort((a, b) => b[1] - a[1])
    .forEach(([region, heat]) => {
      const level = heat >= 8 ? "CRITICAL" : heat >= 7 ? "HIGH" : heat >= 6 ? "ELEVATED" : heat >= 5 ? "MODERATE" : "STABLE";
      body += `- **${region}:** ${heat} (${level})\n`;
    });
  
  body += `\n---\n\n*Powered by DSRT WAE.*`;
  
  // Save
  const briefRecord = {
    brief_date: today,
    global_heat_index: globalHeat,
    heat_change: heatChange,
    threat_level: threatLevel,
    headlines: result.five_things,
    watch_today: result.watch_today || [],
    regional_heat: regionalHeat,
    body_markdown: body,
    auto_generated: true,
    published_at: new Date().toISOString(),
  };
  
  const { data: saved, error } = await supabase
    .from("dsrt_daily_briefs")
    .insert(briefRecord)
    .select()
    .single();
  
  if (error) {
    logger.error(MOD, `Save failed: ${error.message}`);
    return null;
  }
  
  logger.info(MOD, `✓ Daily Brief published for ${today} (Heat: ${globalHeat})`);
  return saved;
}

// Fallback brief when LLM fails — uses raw events
function generateFallbackBrief(date, events, globalHeat, heatChange, threatLevel, regionalHeat) {
  logger.info(MOD, "Generating fallback brief from raw events");
  
  // Pick top 5 diverse events
  const seen = new Set();
  const fiveThings = [];
  
  for (const e of events) {
    if (fiveThings.length >= 5) break;
    const key = `${e.category}-${e.region}`;
    if (seen.has(key)) continue;
    seen.add(key);
    
    fiveThings.push({
      headline: e.title.substring(0, 80),
      summary: e.summary || e.title,
      category: e.category || "general",
      region: e.region || "Global",
      why_it_matters: `Heat score ${e.heat_score}/10 indicates significant ${e.category} development.`,
    });
  }
  
  // If still less than 5, add highest heat regardless
  if (fiveThings.length < 5) {
    for (const e of events) {
      if (fiveThings.length >= 5) break;
      if (fiveThings.find(f => f.headline === e.title)) continue;
      
      fiveThings.push({
        headline: e.title.substring(0, 80),
        summary: e.summary || e.title,
        category: e.category || "general",
        region: e.region || "Global",
        why_it_matters: `Heat score ${e.heat_score}/10.`,
      });
    }
  }
  
  // Build basic body
  let body = `# The DSRT Brief — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}\n\n`;
  body += `**WAE Global Heat Index: ${globalHeat} (${threatLevel}, ${heatChange >= 0 ? "↑" : "↓"} ${Math.abs(heatChange)})**\n\n`;
  body += `Today's intelligence cycle tracked ${events.length} significant events across global regions.\n\n`;
  body += `---\n\n## OVERNIGHT:\n\n`;
  
  fiveThings.forEach((item, i) => {
    body += `### ${i + 1}. ${item.headline}\n\n`;
    body += `${item.summary}\n\n`;
    body += `*${item.category} · ${item.region}*\n\n`;
  });
  
  body += `---\n\n## GLOBAL HEAT BREAKDOWN:\n\n`;
  Object.entries(regionalHeat)
    .sort((a, b) => b[1] - a[1])
    .forEach(([region, heat]) => {
      body += `- **${region}:** ${heat}\n`;
    });
  
  body += `\n---\n\n*Powered by DSRT WAE.*`;
  
  const briefRecord = {
    brief_date: date,
    global_heat_index: globalHeat,
    heat_change: heatChange,
    threat_level: threatLevel,
    headlines: fiveThings,
    watch_today: [],
    regional_heat: regionalHeat,
    body_markdown: body,
    auto_generated: true,
    published_at: new Date().toISOString(),
  };
  
  return supabase
    .from("dsrt_daily_briefs")
    .insert(briefRecord)
    .select()
    .single()
    .then(({ data, error }) => {
      if (error) {
        logger.error(MOD, `Fallback save failed: ${error.message}`);
        return null;
      }
      logger.info(MOD, `✓ Fallback brief published for ${date}`);
      return data;
    });
}
