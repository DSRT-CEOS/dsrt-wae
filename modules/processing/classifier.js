// ============================================
// DSRT WAE — CLASSIFIER (v1.0)
// ============================================
// Categorizes events + extracts countries + region
// Uses keyword matching (V2 will use LLM)
// ============================================

import logger from "../../core/logger.js";

const MOD = "CLASSIFY";

export const MODULE_INFO = {
  id: "classifier",
  name: "Event Classifier",
  version: "1.0.0",
};

// ── CATEGORY KEYWORDS ──
const CATEGORY_KEYWORDS = {
  hot_conflict: [
    "war", "attack", "bombing", "airstrike", "casualties", "killed",
    "invasion", "shelling", "combat", "offensive", "drone strike",
    "missile strike", "firefight", "siege", "massacre", "insurgency",
    "terrorism", "explosion", "ceasefire", "frontline", "battle"
  ],
  military: [
    "military", "defense", "army", "navy", "air force", "weapons",
    "missile", "nuclear", "submarine", "fighter jet", "pentagon",
    "NATO", "deployment", "troops", "ammunition", "arsenal", "warship",
    "aircraft carrier", "stealth", "tank"
  ],
  geopolitics: [
    "sanctions", "diplomacy", "ambassador", "treaty", "alliance",
    "summit", "bilateral", "UN Security Council", "G7", "G20",
    "foreign minister", "state visit", "geopolitical", "territorial",
    "sovereignty", "annexation", "border dispute", "trade war"
  ],
  economy: [
    "economy", "trade", "tariff", "GDP", "inflation", "recession",
    "stock market", "federal reserve", "interest rate", "unemployment",
    "supply chain", "export", "import", "debt", "deficit", "IMF",
    "World Bank", "currency", "forex", "earnings", "revenue"
  ],
  energy: [
    "oil", "gas", "OPEC", "pipeline", "renewable", "solar",
    "nuclear power", "petroleum", "LNG", "crude", "barrel",
    "refinery", "electricity", "power grid", "fuel"
  ],
  technology: [
    "cybersecurity", "hack", "data breach", "AI", "artificial intelligence",
    "tech regulation", "semiconductor", "chip", "5G", "space",
    "satellite", "quantum", "encryption", "surveillance", "deepfake"
  ],
  climate: [
    "climate", "earthquake", "hurricane", "flood", "wildfire",
    "tsunami", "volcano", "drought", "emission", "carbon",
    "Paris agreement", "COP", "environmental", "deforestation",
    "global warming", "extreme weather"
  ],
  social: [
    "election", "protest", "demonstration", "coup", "revolution",
    "referendum", "parliament", "opposition", "democracy",
    "human rights", "migration", "refugee", "asylum", "uprising"
  ],
  health: [
    "pandemic", "virus", "WHO", "vaccine", "outbreak",
    "epidemic", "disease", "health emergency", "quarantine",
    "COVID", "bird flu", "mpox", "ebola", "tuberculosis"
  ],
  diplomacy: [
    "peace talks", "negotiation", "diplomatic", "envoy",
    "consulate", "embassy", "rapprochement", "peace deal",
    "accord", "mediation", "ceasefire agreement"
  ],
};

// ── COUNTRY DETECTION ──
const COUNTRY_KEYWORDS = {
  "United States": ["US ", "USA", "United States", "American", "Washington", "Pentagon", "White House", "Biden", "Trump", "Harris"],
  "Russia": ["Russia", "Russian", "Moscow", "Kremlin", "Putin", "Lavrov"],
  "China": ["China", "Chinese", "Beijing", "Xi Jinping", "PRC", "Shanghai"],
  "Ukraine": ["Ukraine", "Ukrainian", "Kyiv", "Zelensky", "Donbas"],
  "Israel": ["Israel", "Israeli", "Tel Aviv", "Netanyahu", "IDF"],
  "Palestine": ["Palestine", "Palestinian", "Gaza", "Hamas", "West Bank"],
  "Iran": ["Iran", "Iranian", "Tehran", "Khamenei", "Pezeshkian"],
  "North Korea": ["North Korea", "DPRK", "Pyongyang", "Kim Jong"],
  "South Korea": ["South Korea", "Seoul", "Korean peninsula"],
  "India": ["India", "Indian", "New Delhi", "Modi", "Mumbai"],
  "Pakistan": ["Pakistan", "Pakistani", "Islamabad"],
  "Taiwan": ["Taiwan", "Taiwanese", "Taipei"],
  "United Kingdom": ["UK ", "Britain", "British", "London", "Starmer"],
  "France": ["France", "French", "Paris", "Macron"],
  "Germany": ["Germany", "German", "Berlin", "Merz"],
  "Japan": ["Japan", "Japanese", "Tokyo"],
  "Turkey": ["Turkey", "Turkish", "Ankara", "Erdogan"],
  "Saudi Arabia": ["Saudi", "Riyadh", "MBS"],
  "Syria": ["Syria", "Syrian", "Damascus"],
  "Yemen": ["Yemen", "Yemeni", "Houthi"],
  "Lebanon": ["Lebanon", "Lebanese", "Beirut", "Hezbollah"],
  "Egypt": ["Egypt", "Egyptian", "Cairo"],
  "Nigeria": ["Nigeria", "Nigerian", "Lagos"],
  "South Africa": ["South Africa", "Johannesburg"],
  "Brazil": ["Brazil", "Brazilian", "Lula"],
  "Mexico": ["Mexico", "Mexican"],
  "Canada": ["Canada", "Canadian", "Ottawa"],
  "Australia": ["Australia", "Australian", "Canberra"],
  "Italy": ["Italy", "Italian", "Rome", "Meloni"],
  "Spain": ["Spain", "Spanish", "Madrid"],
  "Poland": ["Poland", "Polish", "Warsaw"],
  "Netherlands": ["Netherlands", "Dutch", "Amsterdam"],
  "Sweden": ["Sweden", "Swedish", "Stockholm"],
  "Finland": ["Finland", "Finnish", "Helsinki"],
  "Norway": ["Norway", "Norwegian", "Oslo"],
  "Belgium": ["Belgium", "Brussels"],
  "Greece": ["Greece", "Greek", "Athens"],
  "Argentina": ["Argentina", "Argentine", "Milei"],
  "Venezuela": ["Venezuela", "Maduro", "Caracas"],
  "Cuba": ["Cuba", "Cuban", "Havana"],
  "Indonesia": ["Indonesia", "Jakarta"],
  "Vietnam": ["Vietnam", "Hanoi"],
  "Philippines": ["Philippines", "Manila"],
  "Thailand": ["Thailand", "Bangkok"],
  "Bangladesh": ["Bangladesh", "Dhaka"],
  "Afghanistan": ["Afghanistan", "Kabul", "Taliban"],
  "Iraq": ["Iraq", "Iraqi", "Baghdad"],
  "Sudan": ["Sudan", "Sudanese", "Khartoum"],
  "Ethiopia": ["Ethiopia", "Addis Ababa"],
  "Kenya": ["Kenya", "Nairobi"],
  "Morocco": ["Morocco", "Moroccan", "Rabat"],
  "Algeria": ["Algeria", "Algiers"],
};

// ── REGION MAPPING ──
const REGION_MAP = {
  "United States": "North America", "Canada": "North America", "Mexico": "North America",
  "Brazil": "South America", "Argentina": "South America", "Venezuela": "South America", "Cuba": "South America",
  "Russia": "Europe", "Ukraine": "Europe", "United Kingdom": "Europe",
  "France": "Europe", "Germany": "Europe", "Italy": "Europe", "Spain": "Europe",
  "Poland": "Europe", "Netherlands": "Europe", "Sweden": "Europe", "Finland": "Europe",
  "Norway": "Europe", "Belgium": "Europe", "Greece": "Europe",
  "China": "East Asia", "Japan": "East Asia", "South Korea": "East Asia",
  "Taiwan": "East Asia", "North Korea": "East Asia",
  "India": "South Asia", "Pakistan": "South Asia", "Bangladesh": "South Asia", "Afghanistan": "South Asia",
  "Israel": "Middle East", "Palestine": "Middle East", "Iran": "Middle East",
  "Saudi Arabia": "Middle East", "Turkey": "Middle East", "Syria": "Middle East",
  "Yemen": "Middle East", "Lebanon": "Middle East", "Iraq": "Middle East", "Egypt": "Middle East",
  "Nigeria": "Africa", "South Africa": "Africa", "Sudan": "Africa",
  "Ethiopia": "Africa", "Kenya": "Africa", "Morocco": "Africa", "Algeria": "Africa",
  "Indonesia": "Southeast Asia", "Vietnam": "Southeast Asia",
  "Philippines": "Southeast Asia", "Thailand": "Southeast Asia",
  "Australia": "Oceania",
};

function classifyCategory(text) {
  const lowerText = text.toLowerCase();
  let bestCategory = "general";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        // Longer keywords get more weight
        score += Math.max(1, keyword.length / 8);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

function extractCountries(text) {
  const found = new Set();
  
  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    for (const keyword of keywords) {
      // Use word boundary to avoid false matches
      const regex = new RegExp(`\\b${keyword.trim()}\\b`, "i");
      if (regex.test(text)) {
        found.add(country);
        break; // One match per country is enough
      }
    }
  }

  return Array.from(found);
}

function determineRegion(countries) {
  if (countries.length === 0) return "Global";
  if (countries.length > 3) return "Global"; // Multi-region story

  // Count regions
  const regionCount = {};
  for (const country of countries) {
    const region = REGION_MAP[country];
    if (region) {
      regionCount[region] = (regionCount[region] || 0) + 1;
    }
  }

  if (Object.keys(regionCount).length === 0) return "Global";
  
  // Most mentioned region wins
  return Object.entries(regionCount)
    .sort((a, b) => b[1] - a[1])[0][0];
}

export function classify(events) {
  if (!events || events.length === 0) return [];

  logger.info(MOD, `Classifying ${events.length} events...`);
  const startTime = Date.now();

  const classified = events.map((event) => {
    const fullText = `${event.title || ""} ${event.summary || ""} ${event.content || ""}`;

    const category = classifyCategory(fullText);
    const countries = extractCountries(fullText);
    const region = determineRegion(countries);

    return {
      ...event,
      category,
      countries,
      region,
      status: "processed",
      processed_at: new Date().toISOString(),
    };
  });

  // Stats
  const categoryCounts = {};
  classified.forEach(e => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(MOD, `Classified ${classified.length} events in ${duration}s`);
  logger.debug(MOD, `Distribution: ${JSON.stringify(categoryCounts)}`);

  return classified;
}
