// ============================================
// DSRT WAE — DEDUPLICATOR
// ============================================
// Collapses duplicate events into single records
// Uses: MD5 hashing + title similarity matching
// ============================================

import { createHash } from "crypto";
import logger from "../../core/logger.js";

const MOD = "DEDUP";

export const MODULE_INFO = {
  id: "deduplicator",
  name: "Event Deduplicator",
  version: "1.0.0",
};

// ── GENERATE CONTENT HASH ──
// Same story will generate same hash
function generateHash(event) {
  // Normalize title for hashing
  const normalized = (event.title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")  // Remove special chars
    .replace(/\s+/g, " ")          // Collapse spaces
    .trim()
    .substring(0, 120);            // First 120 chars

  return createHash("md5").update(normalized).digest("hex");
}

// ── TITLE SIMILARITY CHECK ──
// Returns 0-1 score (1 = identical, 0 = totally different)
function similarity(title1, title2) {
  // Tokenize into words
  const words1 = new Set(
    title1.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 3) // Ignore short words
  );
  
  const words2 = new Set(
    title2.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 3)
  );

  if (words1.size === 0 || words2.size === 0) return 0;

  // Jaccard similarity: intersection / union
  const intersection = new Set(
    [...words1].filter(w => words2.has(w))
  );
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

// ── PICK BETTER OF TWO DUPLICATE EVENTS ──
function pickBetter(event1, event2) {
  const score1 = 
    (event1.summary?.length || 0) +
    (event1.content?.length || 0) +
    (event1.image_url ? 50 : 0) +
    (event1.url ? 20 : 0);

  const score2 = 
    (event2.summary?.length || 0) +
    (event2.content?.length || 0) +
    (event2.image_url ? 50 : 0) +
    (event2.url ? 20 : 0);

  return score1 >= score2 ? event1 : event2;
}

// ── MAIN DEDUPLICATION FUNCTION ──
export function deduplicate(events) {
  if (!events || events.length === 0) return [];

  logger.info(MOD, `Processing ${events.length} events for duplicates...`);
  const startTime = Date.now();

  const SIMILARITY_THRESHOLD = 0.55; // 55% word overlap = duplicate
  const seen = new Map(); // hash -> event
  const unique = [];

  for (const event of events) {
    if (!event.title) continue; // Skip events without titles

    const hash = generateHash(event);
    event.content_hash = hash;

    // Check for exact hash match
    if (seen.has(hash)) {
      const existing = seen.get(hash);
      const better = pickBetter(event, existing);
      seen.set(hash, better);
      
      // Replace in unique array
      const idx = unique.findIndex(e => e.content_hash === hash);
      if (idx !== -1) unique[idx] = better;
      continue;
    }

    // Check for similar titles (same story, different wording)
    let foundSimilar = false;
    for (const [existingHash, existingEvent] of seen) {
      if (similarity(event.title, existingEvent.title) > SIMILARITY_THRESHOLD) {
        // Same story — keep the better one
        const better = pickBetter(event, existingEvent);
        if (better === event) {
          // Replace existing with this better one
          seen.set(existingHash, event);
          event.content_hash = existingHash; // Use existing hash
          const idx = unique.findIndex(e => e.content_hash === existingHash);
          if (idx !== -1) unique[idx] = event;
        }
        foundSimilar = true;
        break;
      }
    }

    if (!foundSimilar) {
      seen.set(hash, event);
      unique.push(event);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const reduction = (((events.length - unique.length) / events.length) * 100).toFixed(0);
  
  logger.info(
    MOD, 
    `${events.length} -> ${unique.length} unique (${reduction}% reduction) in ${duration}s`
  );

  return unique;
}
