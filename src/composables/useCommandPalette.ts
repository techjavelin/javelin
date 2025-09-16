import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
// Use the application router directly instead of useRouter() to allow
// palette usage in non-component (test) contexts. Using useRouter()
// outside of a component setup caused getRoutes() to be undefined in
// Vitest because no component instance existed. Importing the router
// singleton gives us stable access to route definitions while keeping
// navigation a best-effort (errors are swallowed in headless tests).
import router from '../router'
import { useAuth } from './useAuth'
import { useRoles } from './useRoles'

export interface Command {
  id: string
  title: string
  keywords?: string
  run: () => any
  group?: string
  // Optional async hint (e.g., network) to show spinner
  async?: boolean
  kind?: 'navigation' | 'action'
  icon?: string // simple emoji or icon key consumed by component
  hidden?: boolean // runtime visibility suppression (after filtering)
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
const hideUnauthorized = ref(false)
const pinned = ref<Set<string>>(new Set())

const PREF_KEY = 'cp.hideUnauthorized.v1'
const PIN_KEY = 'cp.pins.v1'
try { const raw = localStorage.getItem(PREF_KEY); if(raw) hideUnauthorized.value = raw === 'true' } catch {/* ignore */}
try { const p = localStorage.getItem(PIN_KEY); if(p) pinned.value = new Set(JSON.parse(p)) } catch {/* ignore */}
function persistHidePref(){ try { localStorage.setItem(PREF_KEY, hideUnauthorized.value ? 'true':'false') } catch {/* ignore */} }
function persistPins(){ try { localStorage.setItem(PIN_KEY, JSON.stringify(Array.from(pinned.value))) } catch {/* ignore */} }

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

  // Dynamically register route-based navigation commands (excluding parameterized & duplicate paths)
  function humanize(name: string) {
    return name.split(/[-_]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }

  function buildRouteCommands(){
    const { isAuthenticated } = useAuth()
    const { isAdmin, isPentester } = useRoles()
    let routes: any[] = []
    try { routes = router.getRoutes ? router.getRoutes() : [] } catch { routes = [] }
    const cmds: Command[] = []
    const seen = new Set<string>()
    for(const r of routes){
      if(!r.path) continue
      if(r.path.includes('/:')) continue // skip parameterized routes for palette
      if(seen.has(r.path)) continue
      seen.add(r.path)
      const meta: any = r.meta || {}
      // Visibility predicate based on meta flags
      const requiresAuth = !!meta.requiresAuth
      const requiresAdmin = !!meta.requiresAdmin
      const requiresPentester = !!meta.requiresPentester
      // Determine group
      let group = 'Navigation'
      if(r.path.startsWith('/admin')) group = 'Admin'
      else if(r.path.startsWith('/pentester')) group = 'Pentester'
      else if(r.path.startsWith('/blog')) group = 'Blog'
      else if(r.path.startsWith('/pulse')) group = 'Pulse'
      else if(r.path.startsWith('/security-demo')) group = 'Security Demos'
  // Normalize possible symbol route names to string
  const routeNameStr: string | undefined = r.name === undefined ? undefined : String(r.name)

  // Title heuristics
  let titleBase = routeNameStr ? humanize(routeNameStr) : humanize(r.path.replace(/^\//,''))
  // Remove common prefixes in title for clarity
  titleBase = titleBase.replace(/^Admin /,'').replace(/^Pentester /,'').replace(/ Dashboard$/,'')
  // Role badges
  const badges: string[] = []
  if(requiresAdmin) badges.push('Admin')
  else if(requiresPentester) badges.push('Pentester')
  const badgeSuffix = badges.length ? ' ['+badges.join(', ')+']' : ''
  const title = `Go: ${titleBase}${badgeSuffix}`
  const idBase = routeNameStr ? routeNameStr : r.path.replace(/\//g,'_')
  const id = 'nav.' + String(idBase)

      cmds.push({
        id,
        title,
        keywords: [routeNameStr, r.path, group, requiresAdmin?'admin':'', requiresPentester?'pentester':''].filter(Boolean).join(' '),
        group,
        kind: 'navigation',
        icon: requiresAdmin ? '🛡️' : requiresPentester ? '🧪' : '🧭',
        run: () => {
          try {
            // Auth gating at command level (router guard still applies)
            if(requiresAuth && !(isAuthenticated?.value)) return router.push('/login')
            if(requiresAdmin && !(isAdmin?.value)) return router.push('/login')
            if(requiresPentester && !(isPentester?.value)) return router.push('/login')
            return router.push(r.path)
          } catch (e) {
            // In headless test environments navigation isn't critical; swallow.
            return undefined
          }
        },
      })
    }
    return cmds
  }

  function removeRouteNavCommands(){
    registered.value = registered.value.filter(c => !c.id.startsWith('nav.'))
  }

  function rebuildRouteCommands(){
    removeRouteNavCommands()
    registerCommands(buildRouteCommands())
  }

  function ensureCore() {
    // Base action always present
    if(!registered.value.find(c=> c.id==='app.new')) {
      registerCommands([
        { id:'app.new', title:'Application: New', keywords:'create new application app', run: ()=> router.push('/pentester/applications'), group:'Applications', kind:'action', icon:'⚙️' }
      ])
    }
    // Navigation commands if none currently registered
    if(!registered.value.some(c=> c.id.startsWith('nav.'))){
      rebuildRouteCommands()
    }
    // Preference commands
    const prefCmds: Command[] = []
    if(!registered.value.find(c=> c.id==='prefs.toggleHideUnauthorized')){
      prefCmds.push({ id:'prefs.toggleHideUnauthorized', title: hideUnauthorized.value ? 'Prefs: Show Unauthorized Destinations' : 'Prefs: Hide Unauthorized Destinations', group:'Preferences', keywords:'preferences toggle auth visibility', kind:'action', icon:'👁️', run: ()=>{
        hideUnauthorized.value = !hideUnauthorized.value
        persistHidePref()
        const cmd = registered.value.find(c=> c.id==='prefs.toggleHideUnauthorized')
        if(cmd){ cmd.title = hideUnauthorized.value ? 'Prefs: Show Unauthorized Destinations' : 'Prefs: Hide Unauthorized Destinations' }
      } })
    }
    if(!registered.value.find(c=> c.id==='prefs.togglePin')){
      prefCmds.push({ id:'prefs.togglePin', title:'Command: Pin / Unpin Last Run', group:'Preferences', keywords:'pin favorite star', kind:'action', icon:'⭐', run: ()=>{
        const sorted = Object.entries(metaMap.value).sort((a,b)=> (b[1].lastUsed||0)-(a[1].lastUsed||0))
        if(sorted.length){
          const targetId = sorted[0][0]
          if(pinned.value.has(targetId)) pinned.value.delete(targetId); else pinned.value.add(targetId)
          persistPins()
        }
      } })
    }
    if(prefCmds.length) registerCommands(prefCmds)
  }

  ensureCore()

  // Auto hot-reload / dynamic update: track a signature of route names+paths; rebuild if changes
  let lastSignature = ''
  function computeSignature(){
    return router.getRoutes()
      .filter(r=>r.path && !r.path.includes('/:'))
      .map(r=> (r.name !== undefined ? String(r.name) : '') + '|' + r.path)
      .sort()
      .join('#')
  }
  function maybeRebuild(){
    const sig = computeSignature()
    if(sig !== lastSignature){
      lastSignature = sig
      rebuildRouteCommands()
    }
  }
  // Initialize signature
  lastSignature = computeSignature()
  router.afterEach(()=> maybeRebuild())

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

  // Parse inline search operators (group:, kind:, pinned:true, role:admin/pentester)
  function parseFilters(raw: string){
    const filters: any = { group: null, kind: null, pinned: null, role: null, text: '' }
    const parts = raw.split(/\s+/).filter(Boolean)
    for(const p of parts){
      if(p.startsWith('group:')) filters.group = p.slice(6)
      else if(p.startsWith('kind:')) filters.kind = p.slice(5)
      else if(p.startsWith('pinned:')) filters.pinned = p.slice(7) === 'true'
      else if(p.startsWith('role:')) filters.role = p.slice(5)
      else filters.text += (filters.text ? ' ':'') + p
    }
    return filters
  }

  const results = computed(()=>{
    const raw = query.value.trim()
    const { group:groupFilter, kind:kindFilter, pinned:pinFilter, role:roleFilter, text } = parseFilters(raw)
    const q = text
    const { isAdmin, isPentester } = useRoles()
    const list = registered.value
      .filter(c => {
        if(!hideUnauthorized.value) return true
        // When hiding unauthorized, remove nav commands requiring auth/role user lacks
        if(c.id.startsWith('nav.')) {
          const lower = (c.keywords||'')
          const { isAuthenticated } = useAuth()
          const { isAdmin, isPentester } = useRoles()
          const needAdmin = /admin\b/.test(lower) && /admin/.test(lower.split(' ').join('')) // heuristic
          const needPentester = /pentester\b/.test(lower)
          if(needAdmin && !isAdmin.value) return false
          if(needPentester && !isPentester.value) return false
          // Implicit requiresAuth detection: if keywords contains 'admin' or 'pentester' treat as restricted; else allow
          if(/requiresAuth/.test(lower) && !isAuthenticated.value) return false
        }
        return true
      })
      .filter(c => groupFilter ? (c.group?.toLowerCase() === groupFilter.toLowerCase()) : true)
      .filter(c => kindFilter ? (c.kind === kindFilter) : true)
      .filter(c => pinFilter === null ? true : pinFilter === pinned.value.has(c.id))
      .filter(c => {
        if(!roleFilter) return true
        if(roleFilter === 'admin') return /admin/.test(c.keywords||'')
        if(roleFilter === 'pentester') return /pentester/.test(c.keywords||'')
        return true
      })
      .map(c => ({ c, s: fuzzyScore(q, c.title + ' ' + (c.keywords||''), c.id) }))
      .filter(r => r.s > 0 || !q)
      .sort((a,b) => b.s - a.s)
      .map(r => r.c)
    // Pin boost: stable ordering with pinned first (maintain fuzzy ordering inside buckets)
    const pinnedList = list.filter(c=> pinned.value.has(c.id))
    const unpinnedList = list.filter(c=> !pinned.value.has(c.id))
    return [...pinnedList, ...unpinnedList].slice(0,30)
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

  function listAllCommands(){ return [...registered.value] }
  function isPinned(id: string){ return pinned.value.has(id) }
  function togglePin(id: string){ if(pinned.value.has(id)) pinned.value.delete(id); else pinned.value.add(id); persistPins() }

  return { open, query, results, recents, runningCommandId, registerCommands, setCommandTelemetry, run, openPalette, closePalette, toggle, rebuildRouteCommands, listAllCommands, hideUnauthorized, pinned, isPinned, togglePin }
}

// Simple singleton accessor for global palette usage
let singleton: ReturnType<typeof useCommandPalette> | null = null
export function useGlobalCommandPalette(){
  if(!singleton) singleton = useCommandPalette()
  return singleton
}

// Test helper to reset internal state between suites (not used in prod code)
export function resetCommandPaletteForTests(){
  registered.value = []
  metaMap.value = {}
  query.value = ''
  open.value = false
  lastOpenedAt.value = null
  runningCommandId.value = null
  singleton = null
}
