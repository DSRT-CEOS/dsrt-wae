// ============================================
// DSRT WAE — HEAT SCORER (v1.0)
// ============================================
// Assigns 0-10 impact score to every event
// Higher = more critical/impactful
// ============================================

import logger from "../../core/logger.js";

const MOD = "HEAT";

export const MODULE_INFO = {
  id: "heat-scorer",
  name: "Heat Score Calculator",
  version: "1.0.0",
};

// ── HIGH-IMPACT WORDS WITH MINIMUM SCORES ──
const HEAT_WORDS = {
  10: ["nuclear launch", "world war", "nuclear strike", "nuclear attack"],
  9: ["nuclear", "invasion", "declaration of war", "genocide", "chemical weapons", "martial law"],
  8: ["war", "missile strike", "troops deployed", "coup", "emergency", "airstrike", "massacre"],
  7: ["attack", "bombing", "killed", "casualties", "escalation", "sanctions imposed", "blockade"],
  6: ["military", "conflict", "crisis", "threat", "weapon", "deployment", "offensive"],
  5: ["protest", "tension", "dispute", "warning", "alert", "concern", "ceasefire"],
  4: ["negotiation", "talks", "summit", "agreement", "election"],
  3: ["trade", "economic", "regulation", "policy", "reform"],
  2: ["report", "study", "analysis", "forecast", "review"],
};

// ── CATEGORY BASE SCORES ──
const CATEGORY_BASE = {
  hot_conflict: 7.5,
  military: 6.0,
  geopolitics: 5.0,
  health: 5.0,
  energy: 4.5,
  economy: 4.0,
  technology: 3.5,
  social: 4.0,
  climate: 3.5,
  diplomacy: 3.5,
  general: 2.5,
};

// ── HIGH-IMPACT ENTITIES ──
const PRIORITY_ENTITIES = [
  "United States", "Russia", "China", "NATO",
  "Israel", "Iran", "North Korea", "Taiwan", "Ukraine",
  "United Nations", "Security Council", "Pentagon",
  "Kremlin", "White House"
];

const NUCLEAR_POWERS = [
  "United States", "Russia", "China", "United Kingdom", 
  "France", "India", "Pakistan", "Israel", "North Korea"
];

export function scoreHeat(events) {
  if (!events || events.length === 0) return [];

  logger.info(MOD, `Scoring ${events.length} events...`);
  const startTime = Date.now();

  const scored = events.map((event) => {
    const fullText = `${event.title || ""} ${event.summary || ""}`.toLowerCase();
    
    // 1. Start with category base
    let score = CATEGORY_BASE[event.category] || 2.5;

    // 2. Word-based scoring
    for (const [heatLevel, words] of Object.entries(HEAT_WORDS)) {
      for (const word of words) {
        if (fullText.includes(word.toLowerCase())) {
          score = Math.max(score, parseInt(heatLevel));
        }
      }
    }

    // 3. Priority entity boost
    let entityBoost = 0;
    for (const entity of PRIORITY_ENTITIES) {
      if (fullText.includes(entity.toLowerCase())) {
        entityBoost += 0.3;
      }
    }
    score = Math.min(10, score + Math.min(entityBoost, 1.5));

    // 4. Nuclear power involvement = extra serious
    let nuclearCount = 0;
    if (event.countries) {
      for (const country of event.countries) {
        if (NUCLEAR_POWERS.includes(country)) {
          nuclearCount++;
        }
      }
    }
    if (nuclearCount >= 2) {
      score = Math.min(10, score + 1.0); // Two nuclear powers
    }

    // 5. Multi-country events = more significant
    if (event.countries && event.countries.length > 1) {
      score = Math.min(10, score + 0.4);
    }

    // 6. Recency boost (very recent = slightly higher priority)
    if (event.published_at) {
      const ageHours = (Date.now() - new Date(event.published_at).getTime()) / (1000 * 60 * 60);
      if (ageHours < 1) score = Math.min(10, score + 0.3);
      else if (ageHours < 3) score = Math.min(10, score + 0.1);
    }

    // 7. GDELT tone (very negative = higher heat)
    if (event.tone && event.tone < -5) {
      score = Math.min(10, score + 0.5);
    }

    // Round to 1 decimal
    return {
      ...event,
      heat_score: Math.round(score * 10) / 10,
    };
  });

  // Stats
  const critical = scored.filter(e => e.heat_score >= 8).length;
  const high = scored.filter(e => e.heat_score >= 6 && e.heat_score < 8).length;
  const moderate = scored.filter(e => e.heat_score >= 4 && e.heat_score < 6).length;
  const low = scored.filter(e => e.heat_score < 4).length;

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(MOD, `Scored ${scored.length} events in ${duration}s`);
  logger.info(MOD, `Distribution: 🔴${critical} 🟠${high} 🟡${moderate} 🔵${low}`);

  return scored;
}
