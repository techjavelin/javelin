import { ref } from 'vue';
import { fetchAuthSession } from 'aws-amplify/auth';

type LogEntry = { level: string; message: string; context?: any; t: string };
const buffer = ref<LogEntry[]>([]);
let flushTimer: any;

function scheduleFlush() {
  if(flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = undefined; flush(); }, 3000);
}

async function flush() {
  if(!buffer.value.length) return;
  const logs = buffer.value.splice(0, buffer.value.length);
  try {
    // Attach ID token if available
    let headers: Record<string,string> = { 'Content-Type': 'application/json' };
    try { const sess = await fetchAuthSession(); const token = sess.tokens?.idToken?.toString(); if(token) headers.Authorization = token; } catch {}
    await fetch(import.meta.env.VITE_API_BASE_URL + '/client-log', {
      method: 'POST',
      headers,
      body: JSON.stringify({ logs })
    });
  } catch {}
}

function push(level: string, message: string, context?: any) {
  buffer.value.push({ level, message, context, t: new Date().toISOString() });
  if(buffer.value.length >= 50) flush(); else scheduleFlush();
}

export function useLogger() {
  return {
    debug: (m: string, c?: any) => push('debug', m, c),
    info: (m: string, c?: any) => push('info', m, c),
    warn: (m: string, c?: any) => push('warn', m, c),
    error: (m: string, c?: any) => push('error', m, c),
    flush
  };
}

// Optional global window helper for quick ad-hoc logging in console
// @ts-ignore
if(typeof window !== 'undefined') window.__appLogger = { push: (lvl: string, msg: string, ctx?: any)=> push(lvl, msg, ctx), flush };
