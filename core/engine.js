// ============================================
// DSRT WAE — MASTER ENGINE (v2.0)
// ============================================

import config from "./config.js";
import logger from "./logger.js";

import { fetchEvents as fetchGDELT } from "../modules/sources/gdelt.js";
import { fetchEvents as fetchRSS } from "../modules/sources/rss-global.js";

import { deduplicate } from "../modules/processing/deduplicator.js";
import { classify } from "../modules/processing/classifier.js";
import { scoreHeat } from "../modules/processing/heat-scorer.js";
import { generateBriefing } from "../modules/processing/summarizer.js";
import { linkEvents } from "../modules/processing/linker.js";

import { 
  insertEvents, 
  createCycle, 
  completeCycle 
} from "../database/queries.js";

const MOD = "ENGINE";

const SOURCES = [
  { name: "rss-global", fn: fetchRSS },
  { name: "gdelt", fn: fetchGDELT },
];

export async function runCycle() {
  const cycleId = `cycle_${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const startTime = Date.now();
  const errors = [];

  logger.divider();
  logger.info(MOD, `Starting cycle: ${cycleId}`);
  logger.divider();

  await createCycle(cycleId);

  // PHASE 1: INGEST
  logger.info(MOD, "PHASE 1: Ingesting from sources...");
  const rawEvents = [];
  const sourcesHit = [];

  for (const source of SOURCES) {
    try {
      const events = await source.fn();
      rawEvents.push(...events);
      if (events.length > 0) sourcesHit.push(source.name);
      logger.info(MOD, `  ${source.name}: ${events.length} events`);
    } catch (err) {
      const errMsg = `${source.name}: ${err.message}`;
      errors.push(errMsg);
      logger.error(MOD, `  Source failed: ${errMsg}`);
    }
  }

  logger.info(MOD, `Phase 1 done: ${rawEvents.length} raw events from ${sourcesHit.length} sources`);

  if (rawEvents.length === 0) {
    logger.warn(MOD, "No events collected. Ending cycle.");
    await completeCycle(cycleId, {
      events_ingested: 0,
      events_after_dedup: 0,
      events_processed: 0,
      sources_hit: sourcesHit,
      errors,
      ai_briefing: "No events collected this cycle.",
      global_heat_score: 0,
    });
    return { success: true, events: 0 };
  }

  // PHASE 2: DEDUPLICATE
  logger.info(MOD, "PHASE 2: Deduplicating...");
  const uniqueEvents = deduplicate(rawEvents);

  // PHASE 3: CLASSIFY
  logger.info(MOD, "PHASE 3: Classifying...");
  const classifiedEvents = classify(uniqueEvents);

  // PHASE 4: HEAT SCORE
  logger.info(MOD, "PHASE 4: Scoring heat...");
  const scoredEvents = scoreHeat(classifiedEvents);

  // PHASE 5: CYCLE METADATA
  const finalEvents = scoredEvents.map((event) => ({
    ...event,
    cycle_id: cycleId,
    ingested_at: new Date().toISOString(),
  }));

  // PHASE 6: STORE
  logger.info(MOD, "PHASE 5: Storing in database...");
  const stored = await insertEvents(finalEvents);

  // PHASE 7: LINK TO COMPANIES (NEW in V2)
  logger.info(MOD, "PHASE 6: Linking events to companies...");
  let linkStats = { linked: 0, totalLinks: 0 };
  
  if (stored && stored.length > 0) {
    try {
      linkStats = await linkEvents(stored);
      logger.info(MOD, `  Created ${linkStats.totalLinks} company links across ${linkStats.linked} events`);
    } catch (err) {
      logger.error(MOD, `Linking failed: ${err.message}`);
      errors.push(`linker: ${err.message}`);
    }
  }

  // PHASE 8: AI BRIEFING
  logger.info(MOD, "PHASE 7: Generating AI briefing...");
  const briefing = await generateBriefing(scoredEvents);

  // PHASE 9: METRICS
  const globalHeat = scoredEvents.length > 0
    ? Math.round(
        (scoredEvents.reduce((sum, e) => sum + e.heat_score, 0) / scoredEvents.length) * 10
      ) / 10
    : 0;

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  await completeCycle(cycleId, {
    events_ingested: rawEvents.length,
    events_after_dedup: uniqueEvents.length,
    events_processed: stored?.length || 0,
    sources_hit: sourcesHit,
    errors,
    ai_briefing: briefing,
    global_heat_score: globalHeat,
  });

  logger.divider();
  logger.info(MOD, `Cycle complete in ${duration}s`);
  logger.info(MOD, `   Raw: ${rawEvents.length} -> Unique: ${uniqueEvents.length} -> Stored: ${stored?.length || 0}`);
  logger.info(MOD, `   Company Links: ${linkStats.totalLinks} across ${linkStats.linked} events`);
  logger.info(MOD, `   Global Heat: ${globalHeat}/10`);
  logger.divider();

  return {
    success: true,
    cycleId,
    duration: `${duration}s`,
    stats: {
      rawEvents: rawEvents.length,
      uniqueEvents: uniqueEvents.length,
      storedEvents: stored?.length || 0,
      companyLinks: linkStats.totalLinks,
      linkedEvents: linkStats.linked,
      globalHeat,
      sourcesHit,
      errors,
    },
    briefing,
  };
}
