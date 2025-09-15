// Lightweight structured logging helper for Lambda handlers.
export interface LogContextBase { [k: string]: any }

export function createLogger(base: LogContextBase = {}) {
  function line(level: string, msg: string, meta?: Record<string, any>) {
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

export function withLogging<TEvent=any, TResult=any>(name: string, fn: (evt: TEvent, log: ReturnType<typeof createLogger>) => Promise<TResult> | TResult) {
  return async (event: TEvent): Promise<TResult> => {
    const logger = createLogger({ lambda: name });
    logger.info('start');
    try {
      const res = await fn(event, logger);
      logger.info('success');
      return res;
    } catch (e:any) {
      logger.error('failure', { error: e?.message || String(e) });
      throw e;
    }
  };
}
