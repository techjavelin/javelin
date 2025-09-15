// Lightweight structured logging helper for Lambda handlers.
export interface LogContextBase { [k: string]: any }

const LEVEL_ORDER: Record<string, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export function createLogger(base: LogContextBase = {}) {
  const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
  const threshold = LEVEL_ORDER[envLevel] ?? LEVEL_ORDER.info;
  function line(level: string, msg: string, meta?: Record<string, any>) {
    if((LEVEL_ORDER[level] ?? 100) < threshold) return; // filter
    const entry = { ts: new Date().toISOString(), level, msg, ...base, ...(meta||{}) };
    if(level === 'error') console.error(entry); else if(level === 'warn') console.warn(entry); else console.log(entry);
  }
  return {
    debug: (m: string, meta?: any) => line('debug', m, meta),
    info: (m: string, meta?: any) => line('info', m, meta),
    warn: (m: string, meta?: any) => line('warn', m, meta),
    error: (m: string, meta?: any) => line('error', m, meta)
  };
}

function newCorrelationId() {
  // Simple UUID v4-ish generator without crypto dependency
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0; const v = c==='x'? r : (r&0x3|0x8); return v.toString(16);
  });
}

export function withLogging<TEvent=any, TResult=any>(name: string, fn: (evt: TEvent, log: ReturnType<typeof createLogger>, correlationId: string) => Promise<TResult> | TResult) {
  return async (event: any): Promise<TResult> => {
    // Try to derive correlation id from headers if present
    const hdrs = (event?.headers || {});
    const existing = hdrs['x-correlation-id'] || hdrs['X-Correlation-Id'];
    const correlationId = existing || newCorrelationId();
    const logger = createLogger({ lambda: name, correlationId });
    logger.info('start');
    try {
      const res = await fn(event, logger, correlationId);
      logger.info('success');
      // If API Gateway style response, inject header
      if(res && typeof (res as any) === 'object' && 'statusCode' in (res as any)) {
        (res as any).headers = { ...(res as any).headers, 'x-correlation-id': correlationId };
      }
      return res;
    } catch (e:any) {
      logger.error('failure', { error: e?.message || String(e) });
      throw e;
    }
  };
}
