// Lightweight structured logging helper for Lambda handlers.
// Enhanced to optionally forward all log lines to a single centralized CloudWatch Log Group
// specified via the CENTRAL_LOG_GROUP environment variable. This supplements the default
// per-Lambda log groups created automatically by CloudWatch, allowing unified querying.
// The implementation creates (lazily) one log stream per cold start (function instance)
// and buffers events for a short interval to reduce PutLogEvents calls.
import { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand, ResourceAlreadyExistsException, InvalidSequenceTokenException } from '@aws-sdk/client-cloudwatch-logs';
export interface LogContextBase { [k: string]: any }

const LEVEL_ORDER: Record<string, number> = { debug: 10, info: 20, warn: 30, error: 40 };

// Central log forwarding state (module scoped so it persists across invocations in same container)
const CENTRAL_LOG_GROUP = process.env.CENTRAL_LOG_GROUP; // e.g. /javelin/app
let cwClient: CloudWatchLogsClient | undefined;
let logStreamName: string | undefined;
let sequenceToken: string | undefined;
let buffer: { timestamp: number; message: string }[] = [];
let flushTimer: NodeJS.Timeout | undefined;
const FLUSH_INTERVAL_MS = 1500;
const MAX_BATCH = 10_000; // max events per PutLogEvents (far below service limit ~10k)

async function ensureClientAndStream() {
  if(!CENTRAL_LOG_GROUP) return;
  if(!cwClient) cwClient = new CloudWatchLogsClient({});
  if(!logStreamName) {
    const coldId = process.env.AWS_LAMBDA_LOG_STREAM_NAME || `stream-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    logStreamName = coldId;
    try { await cwClient.send(new CreateLogGroupCommand({ logGroupName: CENTRAL_LOG_GROUP })); } catch (e:any) {
      if(!(e instanceof ResourceAlreadyExistsException)) {/* ignore other errors; will surface on put */}
    }
    try { await cwClient.send(new CreateLogStreamCommand({ logGroupName: CENTRAL_LOG_GROUP, logStreamName })); } catch (e:any) {
      if(!(e instanceof ResourceAlreadyExistsException)) {/* ignore */}
    }
  }
}

function scheduleFlush() {
  if(flushTimer || !CENTRAL_LOG_GROUP) return;
  flushTimer = setTimeout(() => { flushTimer = undefined; void flushBuffer(); }, FLUSH_INTERVAL_MS);
}

async function flushBuffer(force = false) {
  if(!CENTRAL_LOG_GROUP) return;
  if(!buffer.length) return;
  if(!force && buffer.length < 20 && flushTimer) {
    // allow more accumulation unless forced
  }
  await ensureClientAndStream();
  if(!cwClient || !logStreamName) return;
  const events = buffer.splice(0, Math.min(buffer.length, MAX_BATCH)).sort((a,b)=> a.timestamp - b.timestamp);
  try {
    const out = await cwClient.send(new PutLogEventsCommand({
      logGroupName: CENTRAL_LOG_GROUP,
      logStreamName,
      logEvents: events,
      sequenceToken
    }));
    sequenceToken = out.nextSequenceToken;
  } catch (e:any) {
    if(e instanceof InvalidSequenceTokenException) {
      sequenceToken = e.expectedSequenceToken;
      try {
        const retryOut = await cwClient.send(new PutLogEventsCommand({
          logGroupName: CENTRAL_LOG_GROUP,
          logStreamName,
          logEvents: events,
          sequenceToken
        }));
        sequenceToken = retryOut.nextSequenceToken;
      } catch {/* swallow to avoid impacting primary execution */}
    }
  }
}

// Best effort flush on process exit (container shutdown) - not guaranteed but helps.
process.on('beforeExit', () => { void flushBuffer(true); });

export function createLogger(base: LogContextBase = {}) {
  const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
  const threshold = LEVEL_ORDER[envLevel] ?? LEVEL_ORDER.info;
  function line(level: string, msg: string, meta?: Record<string, any>) {
    if((LEVEL_ORDER[level] ?? 100) < threshold) return; // filter
    const entry = { ts: new Date().toISOString(), level, msg, ...base, ...(meta||{}) };
    // Console log (primary per-Lambda group)
    if(level === 'error') console.error(entry); else if(level === 'warn') console.warn(entry); else console.log(entry);
    // Forward to central group if configured
    if(CENTRAL_LOG_GROUP) {
      try {
        buffer.push({ timestamp: Date.now(), message: JSON.stringify(entry) });
        if(buffer.length >= 200) { void flushBuffer(true); }
        else scheduleFlush();
      } catch {/* ignore forwarding issues */}
    }
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
