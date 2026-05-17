import { readFileSync, writeFileSync } from "fs";

const file = "modules/global/article-generator.js";
let content = readFileSync(file, "utf-8");

// Add a cleaner function before generateArticle
const cleanerFn = `
// Strip common LLM formatting artifacts
function cleanArticleText(text) {
  if (!text) return text;
  return text
    // Fix literal \\n\\n that didn't get parsed
    .replace(/\\\\n\\\\n/g, "\\n\\n")
    .replace(/\\\\n/g, "\\n")
    // Strip duplicate headers
    .replace(/(##\\s+[^\\n]+)\\n+\\1/g, "$1")
    // Fix double spaces
    .replace(/  +/g, " ")
    // Fix triple newlines
    .replace(/\\n{3,}/g, "\\n\\n")
    .trim();
}

// Detect banned phrases — these auto-reject
const BANNED_PHRASES = [
  "stakes have never been higher",
  "fragile balance of power",
  "delicate tightrope",
  "complex web",
  "ripple effects",
  "in the years to come",
  "perfect storm",
  "uncharted waters",
  "uncharted territory",
  "geopolitical chess",
  "the world watches",
  "tensions escalate",
  "the situation is precarious",
  "may become a focal point",
  "revolutionary",
  "disruptive technology",
  "game-changing",
  "paradigm shift",
  "the next big thing",
  "unprecedented times",
  "to the moon",
  "wagmi",
  "ngmi",
  "diamond hands",
  "climate emergency",
  "ticking time bomb",
  "wake-up call",
];

function detectBannedPhrases(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return BANNED_PHRASES.filter(p => lower.includes(p));
}

// Detect repetition of same phrase 3+ times
function detectExcessRepetition(text) {
  if (!text) return [];
  // Find 3+ word phrases that repeat
  const words = text.toLowerCase().split(/\\s+/);
  const phrases = new Map();
  for (let i = 0; i < words.length - 3; i++) {
    const phrase = words.slice(i, i + 4).join(" ");
    if (phrase.length < 20) continue;
    phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
  }
  return Array.from(phrases.entries())
    .filter(([_, count]) => count >= 3)
    .map(([phrase, _]) => phrase);
}

`;

if (!content.includes("function cleanArticleText")) {
  content = content.replace(
    "// Pick best agent for event",
    cleanerFn + "\n// Pick best agent for event"
  );
}

// Update generateArticle to use cleaner + banned phrase check
const oldQualityCheck = /\/\/ Quality gate: only publish if confidence > 0\.7 AND quality > 6[\s\S]*?if \(quality < 6\) \{[\s\S]*?return \{ rejected: true, reason: `Low quality: \$\{quality\}` \};\s*\}/;

const newQualityCheck = `// Clean text first
  result.body_markdown = cleanArticleText(result.body_markdown);
  result.lead_paragraph = cleanArticleText(result.lead_paragraph);
  
  // Detect banned phrases
  const fullText = \`\${result.title} \${result.lead_paragraph} \${result.body_markdown}\`;
  const bannedFound = detectBannedPhrases(fullText);
  if (bannedFound.length > 0) {
    logger.warn(MOD, \`Rejected — banned phrases: \${bannedFound.join(", ")}\`);
    return { rejected: true, reason: \`Banned phrases: \${bannedFound.join(", ")}\` };
  }
  
  // Detect excessive repetition
  const repetitions = detectExcessRepetition(result.body_markdown);
  if (repetitions.length > 2) {
    logger.warn(MOD, \`Rejected — excessive repetition: \${repetitions.slice(0,2).join(", ")}\`);
    return { rejected: true, reason: \`Repetitive phrases: \${repetitions.slice(0,2).join(", ")}\` };
  }
  
  // Quality gate: tighter than before
  const confidence = parseFloat(result.confidence) || 0;
  const quality = parseFloat(result.quality_self_assessment) || 0;
  
  if (confidence < 0.75) {
    logger.info(MOD, \`Rejected — low confidence \${confidence}\`);
    return { rejected: true, reason: \`Low confidence: \${confidence}\` };
  }
  if (quality < 7) {
    logger.info(MOD, \`Rejected — low quality \${quality}\`);
    return { rejected: true, reason: \`Low quality: \${quality}\` };
  }`;

content = content.replace(oldQualityCheck, newQualityCheck);

writeFileSync(file, content);
console.log("✓ Added cleaner + banned phrase detection + tighter quality gates");
