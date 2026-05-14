// ============================================
// DSRT WAE — AI SUMMARIZER (v1.0)
// ============================================
// Uses Groq (free LLaMA 3) for AI briefings
// Falls back to extractive summary if LLM fails
// ============================================

import logger from "../../core/logger.js";

const MOD = "AI-BRIEF";

export const MODULE_INFO = {
  id: "summarizer",
  name: "AI Briefing Generator",
  version: "1.0.0",
  llm: "llama-3.1-8b-instant via Groq",
};

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

// ── CALL GROQ LLM ──
async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.warn(MOD, "No GROQ_API_KEY found - using fallback");
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(GROQ_API, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: 
              "You are the DSRT World AI Engine — an elite intelligence " +
              "briefing system. You analyze global events and produce " +
              "concise, strategic intelligence reports for analysts and " +
              "decision-makers.\n\n" +
              "Style: Direct, factual, analytical. Use intelligence " +
              "community language. Highlight strategic implications.\n\n" +
              "Format your response with these EXACT sections:\n" +
              "## SITUATION OVERVIEW\n" +
              "(2-3 sentence summary of global state)\n\n" +
              "## CRITICAL DEVELOPMENTS\n" +
              "(bullet points of heat 8+ events with implications)\n\n" +
              "## STRATEGIC ASSESSMENT\n" +
              "(connections between events, what they mean)\n\n" +
              "## GLOBAL THREAT LEVEL\n" +
              "(One of: STABLE / ELEVATED / HIGH / CRITICAL)\n\n" +
              "Keep total response under 400 words. Be sharp."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      logger.warn(MOD, `Groq error ${response.status}: ${errText.substring(0, 100)}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      logger.warn(MOD, "Groq returned empty response");
      return null;
    }

    return content.trim();
  } catch (err) {
    logger.error(MOD, `Groq call failed: ${err.message}`);
    return null;
  }
}

// ── FALLBACK SUMMARY (if LLM fails) ──
function fallbackSummary(events) {
  const hotEvents = events
    .filter(e => e.heat_score >= 6)
    .sort((a, b) => b.heat_score - a.heat_score)
    .slice(0, 8);

  if (hotEvents.length === 0) {
    return "## SITUATION OVERVIEW\nNo critical events detected this cycle. Global situation stable.\n\n## GLOBAL THREAT LEVEL\nSTABLE";
  }

  let summary = "## SITUATION OVERVIEW\n";
  summary += `Tracked ${events.length} events with ${hotEvents.length} elevated threats requiring attention.\n\n`;
  
  summary += "## CRITICAL DEVELOPMENTS\n";
  hotEvents.forEach((e, i) => {
    const emoji = e.heat_score >= 8 ? "🔴" : "🟠";
    summary += `${emoji} **${e.title}**\n`;
    summary += `   Region: ${e.region} | Heat: ${e.heat_score}/10\n\n`;
  });

  const avgHeat = events.reduce((a, b) => a + b.heat_score, 0) / events.length;
  const threat = avgHeat >= 6 ? "CRITICAL" : 
                 avgHeat >= 5 ? "HIGH" :
                 avgHeat >= 4 ? "ELEVATED" : "STABLE";
  
  summary += `## GLOBAL THREAT LEVEL\n${threat}`;
  return summary;
}

// ── MAIN EXPORT ──
export async function generateBriefing(events) {
  logger.info(MOD, `Generating briefing from ${events.length} events...`);
  const startTime = Date.now();

  if (!events || events.length === 0) {
    return "## SITUATION OVERVIEW\nNo events to analyze.\n\n## GLOBAL THREAT LEVEL\nSTABLE";
  }

  // Get top events for LLM (most relevant)
  const topEvents = events
    .sort((a, b) => b.heat_score - a.heat_score)
    .slice(0, 20);

  // Build prompt with structured event data
  const eventsText = topEvents
    .map((e, i) => {
      const countries = e.countries?.length > 0 
        ? `[${e.countries.join(", ")}]` 
        : "";
      return `${i + 1}. [Heat:${e.heat_score}] [${e.category}] [${e.region}] ${countries}\n   ${e.title}`;
    })
    .join("\n\n");

  const prompt = 
    `Analyze these ${topEvents.length} most critical world events from ` +
    `the last 30 minutes and generate a strategic intelligence briefing.\n\n` +
    `EVENTS:\n${eventsText}\n\n` +
    `Identify connections, escalation risks, and strategic implications.`;

  // Try LLM first
  const aiBriefing = await callGroq(prompt);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  if (aiBriefing) {
    logger.info(MOD, `AI briefing generated in ${duration}s (${aiBriefing.length} chars)`);
    return aiBriefing;
  }

  // Fallback
  logger.warn(MOD, "Using fallback summary");
  return fallbackSummary(events);
}
