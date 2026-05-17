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
      errors.push(`${source.name}: ${err.message}`);
      logger.error(MOD, `Source failed: ${err.message}`);
    }
  }

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

  // PHASE 2-4: Process
  logger.info(MOD, "PHASE 2: Deduplicating...");
  const uniqueEvents = deduplicate(rawEvents);

  logger.info(MOD, "PHASE 3: Classifying...");
  const classifiedEvents = classify(uniqueEvents);

  logger.info(MOD, "PHASE 4: Scoring heat...");
  const scoredEvents = scoreHeat(classifiedEvents);

  // PHASE 5: Store
  const finalEvents = scoredEvents.map((event) => ({
    ...event,
    cycle_id: cycleId,
    ingested_at: new Date().toISOString(),
  }));

  logger.info(MOD, "PHASE 5: Storing in database...");
  const stored = await insertEvents(finalEvents);

  // PHASE 6: Link companies (only for HIGH HEAT new events to save LLM calls)
  logger.info(MOD, "PHASE 6: Linking companies (high-impact events only)...");
  let linkStats = { linked: 0, totalLinks: 0 };
  
  if (stored && stored.length > 0) {
    // Only link events with heat >= 6 (saves LLM rate limit budget)
    const highImpactEvents = stored.filter(e => (e.heat_score || 0) >= 6);
    
    if (highImpactEvents.length > 0) {
      logger.info(MOD, `  Linking ${highImpactEvents.length} high-impact events (heat >= 6)`);
      try {
        linkStats = await linkEvents(highImpactEvents);
        logger.info(MOD, `  Created ${linkStats.totalLinks} company links`);
      } catch (err) {
        logger.error(MOD, `Linking failed: ${err.message}`);
        errors.push(`linker: ${err.message}`);
      }
    } else {
      logger.info(MOD, "  No high-impact events to link this cycle");
    }
  }

  // PHASE 7: AI Briefing
  logger.info(MOD, "PHASE 7: Generating AI briefing...");
  const briefing = await generateBriefing(scoredEvents);

  // Metrics
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
  logger.info(MOD, `   Company Links: ${linkStats.totalLinks} across ${linkStats.linked} high-impact events`);
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
