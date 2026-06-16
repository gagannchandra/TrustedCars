const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL = LEVELS[(process.env.LOG_LEVEL || "info").toLowerCase()] ?? 20;
const IS_PROD = process.env.NODE_ENV === "production";
const COLORS = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  reset: "\x1b[0m",
};

function safeMeta(meta) {
  if (!meta || typeof meta !== "object") return {};
  const clean = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined) continue;
    clean[key] = value instanceof Error ? { message: value.message, stack: value.stack } : value;
  }
  return clean;
}

export function createLogger(scope = "app") {
  const write = (level, message, meta) => {
    if (LEVELS[level] < MIN_LEVEL) return;
    const ts = new Date().toISOString();
    const payload = safeMeta(meta);
    if (IS_PROD) {
      const line = JSON.stringify({ ts, level, scope, message, ...payload });
      const stream = level === "error" || level === "warn" ? console.error : console.log;
      stream(line);
    } else {
      const color = COLORS[level];
      const metaStr = Object.keys(payload).length ? ` \x1b[2m${JSON.stringify(payload)}\x1b[0m` : "";
      const label = level.toUpperCase().padEnd(5);
      console.log(`${color}[${ts}] ${label}${COLORS.reset} ${color}[${scope}]${COLORS.reset} ${message}${metaStr}`);
    }
  };
  return {
    debug: (m, meta) => write("debug", m, meta),
    info: (m, meta) => write("info", m, meta),
    warn: (m, meta) => write("warn", m, meta),
    error: (m, meta) => write("error", m, meta),
  };
}

export const logger = createLogger("app");
