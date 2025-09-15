import { ref } from 'vue';
import { fetchAuthSession } from 'aws-amplify/auth';

const LEVEL_ORDER: Record<string, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const envLevel = (import.meta.env.VITE_LOG_LEVEL || 'info').toLowerCase();
const threshold = LEVEL_ORDER[envLevel] ?? LEVEL_ORDER.info;

type LogEntry = { level: string; message: string; context?: any; t: string };
const buffer = ref<LogEntry[]>([]);
let flushTimer: any;

function scheduleFlush() {
  if(flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = undefined; flush(); }, 3000);
}

let correlationId: string | undefined;
function ensureCorrelationId(){
  if(!correlationId){
    correlationId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2);
  }
  return correlationId;
}

async function flush() {
  if(!buffer.value.length) return;
  const logs = buffer.value.splice(0, buffer.value.length);
  try {
    // Attach ID token if available
    let headers: Record<string,string> = { 'Content-Type': 'application/json' };
    try { const sess = await fetchAuthSession(); const token = sess.tokens?.idToken?.toString(); if(token) headers.Authorization = token; } catch {}
  headers['x-correlation-id'] = ensureCorrelationId() || '';
    await fetch(import.meta.env.VITE_API_BASE_URL + '/client-log', {
      method: 'POST',
      headers,
      body: JSON.stringify({ logs })
    });
  } catch {}
}

function push(level: string, message: string, context?: any) {
  if((LEVEL_ORDER[level] ?? 100) < threshold) return;
  buffer.value.push({ level, message, context: { ...(context||{}), correlationId: ensureCorrelationId() }, t: new Date().toISOString() });
  if(buffer.value.length >= 50) flush(); else scheduleFlush();
}

export function useLogger() {
  return {
    debug: (m: string, c?: any) => push('debug', m, c),
    info: (m: string, c?: any) => push('info', m, c),
    warn: (m: string, c?: any) => push('warn', m, c),
    error: (m: string, c?: any) => push('error', m, c),
    flush,
    getCorrelationId: () => ensureCorrelationId()
  };
}

// Optional global window helper for quick ad-hoc logging in console
// @ts-ignore
if(typeof window !== 'undefined') window.__appLogger = { push: (lvl: string, msg: string, ctx?: any)=> push(lvl, msg, ctx), flush, getCorrelationId: ()=> ensureCorrelationId() };
