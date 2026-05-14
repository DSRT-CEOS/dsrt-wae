// ============================================
// DSRT WAE — CORE CONFIGURATION
// All system constants live here
// ============================================
// UPGRADE RULE: ADD new fields, NEVER remove existing
// This file is the single source of truth for the system
// ============================================

const config = {
  // ── SYSTEM METADATA ──
  system: {
    name: "DSRT-WAE",
    fullName: "Deep Strategic Real-Time World AI Engine",
    version: "1.0.0",
    updateIntervalMinutes: 
      parseInt(process.env.UPDATE_INTERVAL_MINUTES) || 30,
    maxEventsPerCycle: 
      parseInt(process.env.MAX_EVENTS_PER_CYCLE) || 50,
  },

  // ── EVENT CATEGORIES ──
  // Used by classifier and UI
  categories: {
    HOT_CONFLICT: {
      id: "hot_conflict",
      label: "Hot Conflict",
      icon: "🔴",
      color: "#FF0000",
      priority: 10,
    },
    MILITARY: {
      id: "military",
      label: "Military & Defense",
      icon: "⚔️",
      color: "#CC0000",
      priority: 9,
    },
    GEOPOLITICS: {
      id: "geopolitics",
      label: "Geopolitics",
      icon: "🌐",
      color: "#FF6600",
      priority: 8,
    },
    ECONOMY: {
      id: "economy",
      label: "Economy & Trade",
      icon: "📊",
      color: "#0066FF",
      priority: 7,
    },
    ENERGY: {
      id: "energy",
      label: "Energy & Resources",
      icon: "⚡",
      color: "#009900",
      priority: 6,
    },
    DIPLOMACY: {
      id: "diplomacy",
      label: "Diplomacy",
      icon: "🤝",
      color: "#3366FF",
      priority: 6,
    },
    HEALTH: {
      id: "health",
      label: "Health & Pandemic",
      icon: "🏥",
      color: "#00CCCC",
      priority: 5,
    },
    TECHNOLOGY: {
      id: "technology",
      label: "Technology & Cyber",
      icon: "💻",
      color: "#9900CC",
      priority: 5,
    },
    SOCIAL: {
      id: "social",
      label: "Social & Political",
      icon: "✊",
      color: "#FF9900",
      priority: 4,
    },
    CLIMATE: {
      id: "climate",
      label: "Climate & Environment",
      icon: "🌍",
      color: "#006633",
      priority: 4,
    },
    GENERAL: {
      id: "general",
      label: "General World News",
      icon: "📰",
      color: "#666666",
      priority: 1,
    },
  },

  // ── HEAT LEVELS ──
  // Maps 0-10 score to visual labels
  heatLevels: {
    CRITICAL: {
      min: 8.0, max: 10.0,
      label: "CRITICAL", icon: "🔴",
      color: "#FF0000",
    },
    HIGH: {
      min: 6.0, max: 7.9,
      label: "HIGH", icon: "🟠",
      color: "#FF6600",
    },
    MODERATE: {
      min: 4.0, max: 5.9,
      label: "MODERATE", icon: "🟡",
      color: "#FFCC00",
    },
    LOW: {
      min: 2.0, max: 3.9,
      label: "LOW", icon: "🔵",
      color: "#0066FF",
    },
    COLD: {
      min: 0.0, max: 1.9,
      label: "STABLE", icon: "🟢",
      color: "#00CC00",
    },
  },

  // ── WORLD REGIONS ──
  regions: [
    "North America", "South America", 
    "Europe", "Middle East",
    "Central Asia", "South Asia", 
    "East Asia", "Southeast Asia",
    "Africa", "Oceania", 
    "Arctic", "Global",
  ],

  // ── ACTIVE MODULES REGISTRY ──
  // Every module added must register here
  // V2 just adds to this list, never removes
  activeModules: {
    sources: [
      "gdelt",
      "rss-global",
    ],
    processing: [
      "deduplicator",
      "classifier",
      "heat-scorer",
      "summarizer",
    ],
  },

  // ── HELPER FUNCTIONS ──
  getHeatLevel: function(score) {
    if (score >= 8) return this.heatLevels.CRITICAL;
    if (score >= 6) return this.heatLevels.HIGH;
    if (score >= 4) return this.heatLevels.MODERATE;
    if (score >= 2) return this.heatLevels.LOW;
    return this.heatLevels.COLD;
  },

  getCategory: function(id) {
    return Object.values(this.categories).find(
      c => c.id === id
    ) || this.categories.GENERAL;
  },
};

export default config;
