// ============================================
// API: /api/event/[id]/enrich  (v2 — structured)
// AI enrichment with proper structured output
// ============================================

import { NextResponse } from "next/server";
import supabase from "../../../../../database/client.js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(GROQ_API, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are an elite geopolitical intelligence analyst at DSRT WAE. " +
              "Generate institutional-grade event briefings. " +
              "Be sharp, factual, and specific. Use real names, numbers, dates. " +
              "Output ONLY valid JSON. No markdown, no preamble.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1200,
        response_format: { type: "json_object" },
      }),
    });

    clearTimeout(timeoutId);
    if (!response.ok) {
      const errText = await response.text();
      console.error("[ENRICH] Groq error:", response.status, errText.substring(0, 200));
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content);
  } catch (err) {
    console.error("[ENRICH] Error:", err.message);
    return null;
  }
}

export async function POST(request, { params }) {
  const { id } = params;

  try {
    const { data: event } = await supabase
      .from("wae_events")
      .select("*")
      .eq("id", id)
      .single();

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Use cache only if NEW format (has structured fields)
    const hasNewFormat = event.ai_summary && 
                        event.why_it_matters && 
                        typeof event.why_it_matters === 'string' &&
                        !event.why_it_matters.startsWith('[');

    if (event.enrichment_status === "enriched" && hasNewFormat) {
      const age = Date.now() - new Date(event.enriched_at).getTime();
      if (age < 24 * 60 * 60 * 1000) {
        return NextResponse.json({
          success: true,
          cached: true,
          data: {
            ai_summary: event.ai_summary,
            why_it_matters: event.why_it_matters,
            what_happens_next: event.what_happens_next,
            ai_analysis: event.ai_analysis,
          },
        });
      }
    }

    const prompt = `You are analyzing a real-time geopolitical event for institutional clients.

EVENT DATA:
Title: ${event.title}
Category: ${event.category}
Region: ${event.region}
Countries Involved: ${(event.countries || []).join(", ") || "Not specified"}
Heat Score: ${event.heat_score}/10
Source: ${event.source_name}
Published: ${event.published_at}
Original Summary: ${event.summary || "Not available"}

Return a JSON object with EXACTLY these 4 string fields. Each field must be a single plain-text string (NOT an array, NOT nested JSON).

Required JSON structure:
{
  "ai_summary": "string - 2-3 sentence executive summary, max 60 words",
  "why_it_matters": "string - 4 short paragraphs separated by double newlines (\\n\\n). Each paragraph starts with a bold label. Format: STRATEGIC SHIFT: [analysis]\\n\\nMARKET IMPACT: [analysis]\\n\\nGEOPOLITICAL IMPLICATIONS: [analysis]\\n\\nAFFECTED STAKEHOLDERS: [analysis]",
  "what_happens_next": "string - 3 predictions separated by double newlines. Format: PREDICTION 1 (7 days): [specific prediction]. Reasoning: [why]\\n\\nPREDICTION 2 (14 days): [specific prediction]. Reasoning: [why]\\n\\nPREDICTION 3 (30 days): [specific prediction]. Reasoning: [why]",
  "ai_analysis": "string - 150-200 words of deeper analysis covering historical parallels, hidden dynamics, second-order effects. Plain prose, no bullets."
}

Be specific. Use real names, real numbers, real dates. No filler words. No hedging language. Speak with authority.

Return ONLY the JSON object. No markdown wrapping. No explanations.`;

    const enrichment = await callGroq(prompt);

    if (!enrichment) {
      return NextResponse.json(
        { success: false, error: "AI enrichment failed" },
        { status: 500 }
      );
    }

    // Validate all fields are strings
    const safeStringify = (val) => {
      if (typeof val === 'string') return val;
      if (Array.isArray(val)) return val.map(v => 
        typeof v === 'string' ? v : (v.text || JSON.stringify(v))
      ).join('\n\n');
      if (typeof val === 'object') return JSON.stringify(val, null, 2);
      return String(val || '');
    };

    const cleanData = {
      ai_summary: safeStringify(enrichment.ai_summary),
      why_it_matters: safeStringify(enrichment.why_it_matters),
      what_happens_next: safeStringify(enrichment.what_happens_next),
      ai_analysis: safeStringify(enrichment.ai_analysis),
    };

    await supabase
      .from("wae_events")
      .update({
        ai_summary: cleanData.ai_summary,
        why_it_matters: cleanData.why_it_matters,
        what_happens_next: cleanData.what_happens_next,
        ai_analysis: cleanData.ai_analysis,
        enrichment_status: "enriched",
        enriched_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      cached: false,
      data: cleanData,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
