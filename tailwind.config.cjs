/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tell Tailwind WHERE to look for class names
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      // ── CUSTOM HEAT COLORS ──
      // These match our 0-10 heat scoring system
      colors: {
        heat: {
          critical: "#FF0000",   // 8-10 → RED
          high:     "#FF6600",   // 6-7  → ORANGE  
          moderate: "#FFCC00",   // 4-5  → YELLOW
          low:      "#0066FF",   // 2-3  → BLUE
          cold:     "#00CC00",   // 0-1  → GREEN
        },
        // Dark theme background shades
        wae: {
          bg:       "#030712",   // Main background (almost black)
          surface:  "#0F172A",   // Cards, panels
          border:   "#1E293B",   // Borders
          muted:    "#334155",   // Muted elements
          text:     "#E2E8F0",   // Main text
          dim:      "#64748B",   // Dimmed text
        }
      },

      // ── MONOSPACE FONT ──
      // Terminal/intelligence feel
      fontFamily: {
        mono: [
          "Courier New",
          "Courier",
          "IBM Plex Mono",
          "monospace"
        ],
        sans: [
          "Inter",
          "system-ui",
          "sans-serif"
        ]
      },

      // ── CUSTOM ANIMATIONS ──
      animation: {
        // Blinking dot for LIVE indicator
        "blink": "blink 1.5s ease-in-out infinite",
        // Pulsing glow for critical events
        "pulse-red": "pulse-red 2s ease-in-out infinite",
        // Sliding in new events
        "slide-in": "slideIn 0.4s ease-out",
        // Scanning line effect
        "scan": "scan 3s linear infinite",
      },

      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.2" },
        },
        "pulse-red": {
          "0%, 100%": { 
            boxShadow: "0 0 0 0 rgba(255, 0, 0, 0.4)" 
          },
          "50%": { 
            boxShadow: "0 0 0 8px rgba(255, 0, 0, 0)" 
          },
        },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scan: {
          "0%":   { transform: "translateY(0%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },

  plugins: [],
};