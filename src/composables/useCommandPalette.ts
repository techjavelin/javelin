import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

export interface Command {
  id: string
  title: string
  keywords?: string
  run: () => any
  group?: string
  // Optional async hint (e.g., network) to show spinner
  async?: boolean
}

interface InternalCommandMeta {
  usageCount: number
  lastUsed: number | null
}

type TelemetryHandler = (ev: { type: 'open' | 'close' | 'run'; id?: string; ts: number }) => void

const registered = ref<Command[]>([])
const metaMap = ref<Record<string, InternalCommandMeta>>({})
const query = ref('')
const open = ref(false)
const lastOpenedAt = ref<number | null>(null)
const runningCommandId = ref<string | null>(null)
const telemetryHandler = ref<TelemetryHandler | null>(null)

const RECENTS_KEY = 'cp.recents.v1'

function loadRecents() {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    if(raw){
      const parsed: Record<string, InternalCommandMeta> = JSON.parse(raw)
      metaMap.value = parsed
    }
  } catch {/* ignore */}
}

function persistRecents() {
  try { localStorage.setItem(RECENTS_KEY, JSON.stringify(metaMap.value)) } catch {/* ignore */}
}

export function registerCommands(cmds: Command[]) {
  const map = new Map(registered.value.map(c => [c.id, c]))
  cmds.forEach(c => {
    map.set(c.id, c)
    if(!metaMap.value[c.id]) metaMap.value[c.id] = { usageCount: 0, lastUsed: null }
  })
  registered.value = Array.from(map.values())
  persistRecents()
}

export function setCommandTelemetry(handler: TelemetryHandler | null){ telemetryHandler.value = handler }

// Advanced fuzzy scoring: subsequence + boundary + acronym weighting + recent usage boost
function fuzzyScore(q: string, text: string, id: string): number {
  if(!q) {
    // Base weight for recency when no query
    const meta = metaMap.value[id]
    const recencyBoost = meta?.lastUsed ? 1 + Math.min(0.5, 0.00005 * (Date.now() - meta.lastUsed) * -1) : 1
    return recencyBoost
  }
  q = q.toLowerCase(); text = text.toLowerCase()
  let ti = 0, score = 0, streak = 0, boundaryHits = 0, acronymMatches = 0
  const words = text.split(/[^a-z0-9]+/).filter(Boolean)
  const acronym = words.map(w=>w[0]).join('')
  // Check acronym partial
  if(acronym.startsWith(q)) acronymMatches = q.length
  for(const qc of q){
    let found = false
    while(ti < text.length){
      const char = text[ti]
      if(char === qc){
        found = true; streak++; score += 2 * streak
        if(ti === 0 || /[^a-z0-9]/.test(text[ti-1])) { boundaryHits++; score += 3 }
        ti++; break
      } else { streak = 0; ti++ }
    }
    if(!found) return 0
  }
  const meta = metaMap.value[id]
  const usageBoost = meta ? 1 + Math.min(0.4, meta.usageCount * 0.05) : 1
  const acronymBoost = acronymMatches ? 1 + acronymMatches * 0.15 : 1
  return (score / (text.length + 1)) * usageBoost * acronymBoost * (1 + boundaryHits * 0.05)
}

export function useCommandPalette() {
  const router = useRouter()

  function ensureCore() {
    if(registered.value.length === 0) {
      registerCommands([
        { id:'nav.home', title:'Go: Home', keywords:'home root main', run: ()=> router.push('/') , group:'Navigation' },
        { id:'nav.admin', title:'Go: Admin Dashboard', keywords:'admin dashboard', run: ()=> router.push('/admin'), group:'Navigation' },
        { id:'nav.pentester', title:'Go: Pentester Portal', keywords:'pentest engagements', run: ()=> router.push('/pentester'), group:'Navigation' },
        { id:'nav.pentesterApps', title:'Go: Applications (Pentester)', keywords:'applications apps pentest', run: ()=> router.push('/pentester/applications'), group:'Navigation' },
        { id:'app.new', title:'Application: New', keywords:'create new application app', run: ()=> router.push('/pentester/applications'), group:'Applications' }
      ])
    }
  }

  ensureCore()

  function openPalette(){ if(!open.value){ open.value = true; lastOpenedAt.value = Date.now(); telemetryHandler.value?.({ type:'open', ts: Date.now() }) } }
  function closePalette(){ if(open.value){ open.value = false; query.value = ''; telemetryHandler.value?.({ type:'close', ts: Date.now() }) } }
  function toggle(){ open.value ? closePalette() : openPalette() }

  function run(cmd: Command){
    const meta = metaMap.value[cmd.id]
    if(meta){ meta.usageCount++; meta.lastUsed = Date.now(); persistRecents() }
    telemetryHandler.value?.({ type:'run', id: cmd.id, ts: Date.now() })
    let res: any
    try {
      const maybe = cmd.run()
      if(cmd.async && maybe && typeof maybe.then === 'function') {
        runningCommandId.value = cmd.id
        return maybe.finally(()=>{ runningCommandId.value = null; closePalette() })
      } else {
        res = maybe
        closePalette()
        return res
      }
    } catch (e) {
      runningCommandId.value = null
      closePalette()
      throw e
    }
  }

  const results = computed(()=>{
    const q = query.value.trim()
    const list = registered.value.map(c => ({ c, s: fuzzyScore(q, c.title + ' ' + (c.keywords||''), c.id) }))
      .filter(r => r.s > 0 || !q)
      .sort((a,b) => b.s - a.s)
      .map(r => r.c)
    return list.slice(0, 30)
  })

  function onKey(e: KeyboardEvent){
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); toggle() }
    else if(e.key === 'Escape' && open.value){ closePalette() }
  }

  onMounted(()=> { loadRecents(); document.addEventListener('keydown', onKey) })
  onBeforeUnmount(()=> document.removeEventListener('keydown', onKey))

  const recents = computed(()=> Object.entries(metaMap.value)
    .filter(([,m])=> m.lastUsed)
    .sort((a,b)=> (b[1].lastUsed||0) - (a[1].lastUsed||0))
    .slice(0,8)
    .map(([id])=> registered.value.find(c=>c.id===id)).filter(Boolean) as Command[])

  return { open, query, results, recents, runningCommandId, registerCommands, setCommandTelemetry, run, openPalette, closePalette, toggle }
}

// Simple singleton accessor for global palette usage
let singleton: ReturnType<typeof useCommandPalette> | null = null
export function useGlobalCommandPalette(){
  if(!singleton) singleton = useCommandPalette()
  return singleton
}
