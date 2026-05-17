import { readFileSync, writeFileSync } from "fs";

const file = "modules/global/article-generator.js";
let content = readFileSync(file, "utf-8");

// Replace the WRITING INSTRUCTIONS section in the user prompt
const oldRules = /CRITICAL RULES:\s*1\. DO NOT cite sources[\s\S]*?8\. Provide useful analysis, not just news rehash\./;

const newRules = `CRITICAL RULES:
1. DO NOT cite sources or mention "according to reports". Write as your own analysis.
2. DO NOT mention WAE event IDs, source URLs, or internal data systems.
3. DO NOT speculate about company impacts beyond what's listed above. If no companies listed, focus on macro/geopolitical analysis only.
4. BE CONSERVATIVE: Use "may", "could", "suggests" — not "will", "definitely".
5. NO sensationalism. Reuters editorial standards.
6. Length: 500-650 words.
7. Provide useful analysis, not just news rehash.

MANDATORY SPECIFICITY REQUIREMENTS (article will be REJECTED if these are missing):
- Include AT LEAST 4 specific numbers (dollar amounts, percentages, dates, quantities)
- Name AT LEAST 1 specific person (official, executive, analyst) by name and title
- Reference AT LEAST 1 specific document/treaty/regulation/filing by name and year
- Include AT LEAST 1 specific geographic location beyond country level (city, port, facility)
- Provide ONE concrete indicator to watch (specific event, date, or threshold)

BANNED PHRASES (article will be REJECTED if you use any of these):
"stakes are high", "stakes have never been higher", "fragile balance", "complex web",
"ripple effects", "in the years to come", "perfect storm", "uncharted waters",
"geopolitical chess", "tensions escalate", "high-stakes", "revolutionary",
"game-changing", "paradigm shift", "in a world where", "now more than ever",
"according to reports", "many experts believe", "sources suggest"

ALSO BANNED:
- Lazy historical parallels (don't compare modern events to 1989 Bush-Deng, 
  1973 Arab-Israeli War, Cold War, Great Game unless the parallel is EXACT)
- Generic conclusions that just restate the lead
- Vague predictions without specific thresholds`;

content = content.replace(oldRules, newRules);

writeFileSync(file, content);
console.log("✓ Updated LLM prompt with mandatory specificity requirements");
