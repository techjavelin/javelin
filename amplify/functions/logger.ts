// Simple structured logger utility reused across Lambda handlers.
// Usage: import { logger } from '../logger';
// logger.debug('message', { context });
// Respects LOG_LEVEL env var (debug|info|warn|error). Defaults to info.

const levelOrder: Record<string, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function currentLevel() {
  const raw = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return levelOrder[raw] ?? levelOrder.info;
}

function base(level: keyof typeof levelOrder, msg: string, meta?: any) {
  if (levelOrder[level] < currentLevel()) return;
  const record = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ? sanitize(meta) : {})
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(record));
}

// Redact obvious secret-ish keys
function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const redactedKeys = [/password/i, /secret/i, /token/i, /authorization/i];
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (redactedKeys.some(r => r.test(k))) {
      out[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      out[k] = sanitize(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export const logger = {
  debug: (msg: string, meta?: any) => base('debug', msg, meta),
  info: (msg: string, meta?: any) => base('info', msg, meta),
  warn: (msg: string, meta?: any) => base('warn', msg, meta),
  error: (msg: string, meta?: any) => base('error', msg, meta)
};
