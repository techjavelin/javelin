import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { withUserAuth } from '../amplifyClient'
import { normalizeError } from './useError'
import { fetchAuthSession } from 'aws-amplify/auth'

// ESM-safe helper to load amplify outputs lazily (avoids require in ESM build)
async function loadOutputs(): Promise<any> {
  try {
    const mod = await import('../../amplify_outputs.json', { assert: { type: 'json' } } as any)
    // Vite / TS may place JSON under .default
    return (mod as any).default || mod
  } catch {
    try {
      // Fallback plain import without assertion for environments not supporting it
      const mod = await import('../../amplify_outputs.json')
      return (mod as any).default || mod
    } catch {
      return {}
    }
  }
}
let outputsCache: any | null = null
async function getOutputs(): Promise<any> {
  if (outputsCache) return outputsCache
  outputsCache = await loadOutputs()
  return outputsCache
}

const client = generateClient<Schema>()

/**
 * Migration management composable
 * - Auth: Adds Cognito id token (Authorization header) when available to REST calls
 * - Endpoints used: GET /migrations-state, POST /run-migrations
 * - Lock takeover: runPending({ takeover:true }) will force replace existing lock (admin explicit action)
 */
export function useMigrations(){
  const latestCodeVersion = ref<number>(0)
  const latestApplied = ref<number | null>(null)
  const loading = ref(false)
  const error = ref('')
  const running = ref(false)
  const logs = ref<string[]>([])
  const lastRunSummary = ref<any | null>(null)
  const lastRunAt = ref<string | null>(null)
  const appliedList = ref<any[]>([])
  const lockInfo = ref<any | null>(null)

  // Initialize latestCodeVersion asynchronously (doesn't block composable creation)
  ;(async () => {
    try {
      const outs = await getOutputs()
      latestCodeVersion.value = outs?.custom?.MIGRATIONS?.latest || 0
    } catch { latestCodeVersion.value = 0 }
  })()

  function log(line: string){ logs.value.push(line) }

  async function refreshApplied(){
    loading.value = true; error.value=''
    try {
      const res = await client.models.Migration.list(withUserAuth({}))
      const ids = (res.data||[]).map(r=>r?.id||0)
      latestApplied.value = ids.length ? Math.max(...ids) : 0
    } catch(e:any){
      error.value = normalizeError(e,'Failed to load applied migrations').message
    } finally { loading.value = false }
  }

  async function authHeaders(): Promise<Record<string,string>> {
    try {
      const session = await fetchAuthSession();
      const token = (session as any)?.tokens?.idToken?.toString?.();
      if(token) return { 'Content-Type':'application/json', 'Authorization': token };
    } catch {}
    return { 'Content-Type':'application/json' };
  }

  async function fetchState(){
    loading.value = true; error.value=''
    try {
      const outs = await getOutputs()
      const api = outs?.custom?.API || {}
      const restEntry = Object.values(api)[0] as any
      if(!restEntry?.endpoint) throw new Error('REST API endpoint missing')
      const url = restEntry.endpoint.replace(/\/$/, '') + '/migrations-state'
      const headers = await authHeaders()
      const res = await fetch(url, { method: 'GET', headers })
      if(!res.ok) throw new Error(`State fetch failed ${res.status}`)
      const json = await res.json()
      appliedList.value = json.migrations || []
      lockInfo.value = json.lock || null
      latestApplied.value = appliedList.value.length ? Math.max(...appliedList.value.map((m:any)=>m.id)) : 0
    } catch(e:any){
      error.value = normalizeError(e,'Failed to fetch migration state').message
    } finally { loading.value = false }
  }

  async function runPending(opts: { takeover?: boolean } = {}){
    if(running.value) return
    running.value = true; error.value=''; logs.value=[]
    try {
      log('Starting client-triggered migration run...')
      await refreshApplied()
      const codeVersion = latestCodeVersion.value
      if((latestApplied.value||0) >= codeVersion && !opts.takeover){
        log('No pending migrations.')
        return
      }
      log(`Pending migrations (or forced): applied=${latestApplied.value||0} code=${codeVersion} takeover=${!!opts.takeover}`)
      const outs = await getOutputs()
      const api = outs?.custom?.API || {}
      const restEntry = Object.values(api)[0] as any
      if(!restEntry?.endpoint){
        log('REST API endpoint not found in outputs.')
        return
      }
      const url = restEntry.endpoint.replace(/\/$/, '') + '/run-migrations'
      const headers = await authHeaders()
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ takeover: !!opts.takeover }) })
      if(!res.ok){
        const body = await res.text();
        log(`Run failed status=${res.status}`)
        error.value = `Migration run failed: ${body}`
        return
      }
      const json = await res.json()
      lastRunSummary.value = json.summary
      lastRunAt.value = new Date().toISOString()
      log(`Run complete: applied=${json.summary?.applied} skipped=${json.summary?.skipped} failed=${json.summary?.failed?1:0}`)
    } catch(e:any){
      error.value = normalizeError(e,'Migration run failed').message
    } finally { running.value = false; await refreshApplied() }
  }

  return { latestCodeVersion, latestApplied, appliedList, lockInfo, loading, running, error, logs, lastRunSummary, lastRunAt, refreshApplied, fetchState, runPending }
}
