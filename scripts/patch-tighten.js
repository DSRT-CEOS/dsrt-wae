import { readFileSync, writeFileSync } from "fs";

const file = "modules/global/article-generator.js";
let content = readFileSync(file, "utf-8");

// Expand BANNED_PHRASES list
const oldBanned = /const BANNED_PHRASES = \[[\s\S]*?\];/;

const newBanned = `const BANNED_PHRASES = [
  // Stakes variants
  "stakes have never been higher",
  "stakes are high",
  "stakes could not be higher",
  "the stakes",
  // Balance variants
  "fragile balance of power",
  "delicate balance",
  "delicate tightrope",
  "balance is on the brink",
  // Complex/web cliches
  "complex web",
  "intricate web",
  "tangled web",
  "web of",
  // Ripple/cascade
  "ripple effects",
  "ripple effect",
  "knock-on effects",
  // Time cliches
  "in the years to come",
  "in the coming years",
  "in the days ahead",
  "for years to come",
  "the years ahead",
  // Storm/uncharted
  "perfect storm",
  "uncharted waters",
  "uncharted territory",
  "unprecedented times",
  // Geopolitical cliches  
  "geopolitical chess",
  "the world watches",
  "tensions escalate",
  "the situation is precarious",
  "may become a focal point",
  "high-stakes",
  "high stakes",
  // Tech cliches
  "revolutionary",
  "disruptive technology",
  "game-changing",
  "paradigm shift",
  "the next big thing",
  "groundbreaking",
  // Crypto cliches
  "to the moon",
  "wagmi",
  "ngmi",
  "diamond hands",
  "paper hands",
  // Climate alarmist
  "climate emergency",
  "ticking time bomb",
  "wake-up call",
  "point of no return",
  // Lazy openers
  "in a world where",
  "in today's world",
  "more than ever before",
  "now more than ever",
  // Lazy connectors
  "needless to say",
  "it goes without saying",
  "at the end of the day",
  // Vague claims
  "many experts believe",
  "some analysts say",
  "sources suggest",
  "according to reports",
];`;

content = content.replace(oldBanned, newBanned);

// Also add: detect when article is too vague (light on numbers)
const oldRepCheck = /\/\/ Detect excessive repetition[\s\S]*?const repetitions = detectExcessRepetition\(result\.body_markdown\);[\s\S]*?\}/;

const newRepCheck = `// Detect excessive repetition
  const repetitions = detectExcessRepetition(result.body_markdown);
  if (repetitions.length > 2) {
    logger.warn(MOD, \`Rejected — excessive repetition: \${repetitions.slice(0,2).join(", ")}\`);
    return { rejected: true, reason: \`Repetitive phrases: \${repetitions.slice(0,2).join(", ")}\` };
  }
  
  // Detect vagueness — count specific numbers in body
  const numberMatches = (result.body_markdown.match(/\\d+(?:\\.\\d+)?(?:\\s*%|\\s*billion|\\s*million|\\s*trillion|\\s*bps|\\s*kg|\\s*km|\\s*MMBtu|\\s*GW|\\s*MW|barrels|\\$\\d)/gi) || []).length;
  const dollarSigns = (result.body_markdown.match(/\\$\\d/g) || []).length;
  const totalSpecifics = numberMatches + dollarSigns;
  
  if (totalSpecifics < 3) {
    logger.warn(MOD, \`Rejected — too vague (only \${totalSpecifics} specific numbers)\`);
    return { rejected: true, reason: \`Too vague: only \${totalSpecifics} specific numbers\` };
  }`;

content = content.replace(oldRepCheck, newRepCheck);

// Also fix the unicode artifacts (curly quotes, non-breaking spaces)
const oldClean = /function cleanArticleText\(text\) \{[\s\S]*?return text[\s\S]*?\.trim\(\);\s*\}/;

const newClean = `function cleanArticleText(text) {
  if (!text) return text;
  return text
    // Fix literal escaped newlines
    .replace(/\\\\n\\\\n/g, "\\n\\n")
    .replace(/\\\\n/g, "\\n")
    // Replace fancy unicode chars with ASCII
    .replace(/\\u2018|\\u2019/g, "'")        // smart quotes
    .replace(/\\u201C|\\u201D/g, '"')        // smart double quotes
    .replace(/\\u2013|\\u2014/g, "-")        // en/em dashes
    .replace(/\\u2026/g, "...")            // ellipsis
    .replace(/\\u00A0/g, " ")              // non-breaking space
    .replace(/\\u200B/g, "")               // zero-width space
    // Strip duplicate headers
    .replace(/(##\\s+[^\\n]+)\\n+\\1/g, "$1")
    // Fix double spaces
    .replace(/  +/g, " ")
    // Fix triple newlines
    .replace(/\\n{3,}/g, "\\n\\n")
    .trim();
}`;

content = content.replace(oldClean, newClean);

writeFileSync(file, content);
console.log("✓ Tightened banned phrases (now 55+ patterns)");
console.log("✓ Added vagueness detector (min 3 specific numbers required)");
console.log("✓ Added unicode normalization (smart quotes, dashes)");
