// ============================================
// DSRT WAE — LOGGER
// Centralized logging for the entire system
// Tracks: every operation, every error, every cycle
// ============================================

const LOG_LEVELS = {
  DEBUG:    { value: 0, color: "\x1b[90m", label: "DBG" },
  INFO:     { value: 1, color: "\x1b[36m", label: "INF" },
  WARN:     { value: 2, color: "\x1b[33m", label: "WRN" },
  ERROR:    { value: 3, color: "\x1b[31m", label: "ERR" },
  CRITICAL: { value: 4, color: "\x1b[91m", label: "CRT" },
};

const RESET = "\x1b[0m";

class WAELogger {
  constructor() {
    this.history = [];
    this.maxHistory = 1000;
    this.minLevel = "INFO"; // Show INFO and above
  }

  _log(level, module, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
    };

    // Store in history
    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-500);
    }

    // Format for console
    const lvl = LOG_LEVELS[level];
    const time = new Date().toLocaleTimeString("en-US", { 
      hour12: false 
    });
    const prefix = `${lvl.color}[${time}][WAE][${lvl.label}][${module}]${RESET}`;
    
    // Output to console
    if (level === "ERROR" || level === "CRITICAL") {
      console.error(`${prefix} ${message}`, data || "");
    } else if (level === "WARN") {
      console.warn(`${prefix} ${message}`, data || "");
    } else {
      console.log(`${prefix} ${message}`, data || "");
    }
  }

  debug(module, msg, data)    { this._log("DEBUG", module, msg, data); }
  info(module, msg, data)     { this._log("INFO", module, msg, data); }
  warn(module, msg, data)     { this._log("WARN", module, msg, data); }
  error(module, msg, data)    { this._log("ERROR", module, msg, data); }
  critical(module, msg, data) { this._log("CRITICAL", module, msg, data); }

  // Get recent log entries (useful for debugging UI)
  getRecent(count = 50) {
    return this.history.slice(-count);
  }

  // Get only errors from history
  getErrors() {
    return this.history.filter(
      e => e.level === "ERROR" || e.level === "CRITICAL"
    );
  }

  // Pretty print a divider for cycle separation
  divider(module = "SYSTEM") {
    const line = "═".repeat(50);
    console.log(`\x1b[36m${line}\x1b[0m`);
  }

  // Section header
  section(module, title) {
    this.divider();
    this.info(module, `📍 ${title}`);
    this.divider();
  }
}

// Singleton instance — same logger everywhere
const logger = new WAELogger();

export default logger;
