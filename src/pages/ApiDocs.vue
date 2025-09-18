<template>
  <div class="api-docs-page" :class="{ loading }">
    <div v-if="loading" class="loading-state">Loading API documentation…</div>
    <div class="toolbar" v-if="!loading">
      <button class="toggle-btn" type="button" @click="toggleRaw">
        {{ showRaw ? 'Show Rendered Docs' : 'Show Raw Spec' }}
      </button>
    </div>
    <div v-show="!showRaw" id="redoc-container" ref="container"></div>
    <pre v-show="showRaw" class="raw-spec" v-text="rawSpec"></pre>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

// We'll dynamically import Redoc standalone script from CDN to avoid bundling large asset
const loading = ref(true)
const container = ref<HTMLDivElement | null>(null)
const showRaw = ref(false)
const rawSpec = ref('')
let cachedSpecText: string | null = null
let lastIsDark: boolean | null = null

function toggleRaw(){
  showRaw.value = !showRaw.value
  if (!showRaw.value) {
    // If returning to rendered view after toggle, re-init Redoc (lightweight enough for occasional use)
    setTimeout(initRedoc, 0)
  }
}

function sniffLooksLikeYaml(text: string) {
  // Basic heuristic: presence of 'openapi:' at start or within first 200 chars.
  return /^openapi:\s*3/.test(text) || text.slice(0, 200).includes('\nopenapi:')
}

async function loadRedoc() {
  // If already present skip
  if ((window as any).Redoc) return (window as any).Redoc
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Redoc'))
    document.head.appendChild(script)
  })
  return (window as any).Redoc
}

function readCssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function buildTheme(isDark: boolean) {
  // Resolve CSS custom properties to concrete values because Redoc's theme passes them
  // through polished color utilities which do not understand CSS variable syntax.
  const primary = readCssVar('--color-primary', '#2566af')
  const primaryAlt = readCssVar('--color-primary-dark', '#1e40af')
  const textLight = readCssVar('--color-text-light', '#1a365d')
  const textDark = readCssVar('--color-text-dark', '#e0e0e0')
  const cardLight = readCssVar('--color-card-light', '#f8f9fa')
  const cardDark = readCssVar('--color-card-dark', '#232b44')
  const bgLight = readCssVar('--color-bg-light', '#ffffff')
  const bgDark = readCssVar('--color-bg-dark', '#181e2a')
  const border = readCssVar('--color-border', '#2a2f3a')

  const baseText = isDark ? textDark : textLight
  const secondaryText = isDark ? '#b8c2d1' : '#4b5b6d'
  const itemBg = isDark ? cardDark : cardLight
  const pageBg = isDark ? bgDark : bgLight

  return {
    spacing: { sectionVertical: 28, unit: 6 },
    typography: {
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      headings: { fontFamily: 'Inter, Segoe UI, Arial, sans-serif', fontWeight: '600' },
      code: { fontFamily: 'SFMono-Regular, Menlo, Consolas, monospace', fontSize: '13px' }
    },
    colors: {
      primary: { main: primary },
      text: { primary: baseText, secondary: secondaryText },
      http: {
        get: primary,
        post: '#43a047',
        put: '#f59e42',
        delete: '#e53935',
        patch: primaryAlt
      },
      border: { dark: border },
      responses: { success: '#43a047', error: '#e53935', redirect: primary, info: primary },
      tonalOffset: 0.35,
      background: { items: itemBg, controls: itemBg, secondary: pageBg }
    },
    sidebar: { width: '300px', backgroundColor: itemBg, activeTextColor: primary, activeBgColor: isDark ? '#1f2734' : '#eef5fb' },
    rightPanel: { backgroundColor: itemBg, width: '40%' },
    logo: { gutter: '8px' }
  }
}

function applyThemeObserver() {
  const root = document.documentElement
  const observer = new MutationObserver(async (mutations) => {
    if (mutations.some(m=>m.attributeName === 'data-theme')) {
      const isDark = root.getAttribute('data-theme') === 'dark'
      if (isDark === lastIsDark) return
      lastIsDark = isDark
      if (!showRaw.value && cachedSpecText) {
        // Re-init with cached spec (avoid refetch) by using spec object instead of URL if available later.
        const target = container.value
        if (!target) return
        try {
          const Redoc = await loadRedoc()
            // Wipe existing content before re-init to prevent stacking.
          target.innerHTML = ''
          const theme = buildTheme(isDark)
          await Redoc.init('/openapi.yaml', { hideDownloadButton: true, suppressWarnings: true, theme }, target)
        } catch (e) {
          console.warn('Theme re-init failed', e)
        }
      }
    }
  })
  observer.observe(root, { attributes: true })
}

async function initRedoc(){
  const target = container.value
  if (!target) return
  let specText = ''
  try {
    const resp = await fetch('/openapi.yaml', { cache: 'no-cache' })
    if (!resp.ok) throw new Error('Spec fetch failed: ' + resp.status)
    specText = await resp.text()
  } catch (e) {
    target.innerHTML = '<p style="color:red">Failed to fetch OpenAPI spec at /openapi.yaml</p>'
    loading.value = false
    return
  }
  if (!sniffLooksLikeYaml(specText)) {
    target.innerHTML = '<p style="color:red">Fetched /openapi.yaml but content did not look like an OpenAPI YAML (missing openapi:)</p>'
    rawSpec.value = specText
    loading.value = false
    return
  }
  rawSpec.value = specText
  cachedSpecText = specText
  try {
    const Redoc = await loadRedoc()
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const theme = buildTheme(isDark)
  await Redoc.init('/openapi.yaml', { hideDownloadButton: true, suppressWarnings: true, theme }, target)
  lastIsDark = isDark
  applyThemeObserver()
  } catch (e) {
    console.error('Failed to initialize Redoc', e)
    // Do not overwrite with raw automatically; allow user to toggle.
  } finally {
    loading.value = false
  }
}

onMounted(initRedoc)
</script>

<style scoped>
.api-docs-page { position: relative; min-height: 65vh; padding: 8px 0 48px; background: var(--color-bg-light); }
[data-theme="dark"] .api-docs-page { background: var(--color-bg-dark); }
.loading-state { padding: 48px 0; text-align: center; color: #666; font-size: 14px; }
#redoc-container { padding-top: 4px; background: var(--color-bg-light); }
[data-theme="dark"] #redoc-container { background: var(--color-bg-dark); }

/* Toolbar */
.toolbar { position: sticky; top: 0; z-index: 20; display:flex; justify-content:flex-start; padding:6px 12px; background: var(--color-bg-light); border-bottom:1px solid var(--color-border); backdrop-filter: blur(6px); }
[data-theme="dark"] .toolbar { background: rgba(24,30,42,0.9); border-color:#2a3340; }
.toggle-btn { background: var(--color-primary); color:#fff; border:none; font-size:12px; padding:6px 14px; border-radius:6px; cursor:pointer; font-weight:500; letter-spacing:.3px; box-shadow:0 2px 4px rgba(0,0,0,.25); }
.toggle-btn:hover { filter:brightness(1.1); }
.toggle-btn:active { transform:translateY(1px); }

.raw-spec { background:#0f1115; color:#e6e6e6; padding:16px 18px; border-radius:8px; font-size:12px; line-height:1.45; overflow:auto; box-shadow:0 2px 8px rgba(0,0,0,.35); }

#redoc-container :deep(h1) { margin-top: 0; }
/* Unified palette mapping */
#redoc-container :deep(.menu-content),
#redoc-container :deep(.api-content) {
  background: var(--color-bg-light) !important;
  color: var(--color-text-light) !important;
}
[data-theme="dark"] #redoc-container :deep(.menu-content),
[data-theme="dark"] #redoc-container :deep(.api-content) { background: var(--color-bg-dark) !important; color: var(--color-text-dark) !important; }
#redoc-container :deep(.redoc-wrap) { background: var(--color-bg-light) !important; }
[data-theme="dark"] #redoc-container :deep(.redoc-wrap) { background: var(--color-bg-dark) !important; }
/* Absolute fallback: if any internal wrapper still paints white, force entire subtree dark */
/* Avoid blanket forcing of every descendant to bg-dark; only fix specific leakage points */
[data-theme="dark"] #redoc-container :deep(.api-content),
[data-theme="dark"] #redoc-container :deep(.menu-content) {
  background: var(--color-bg-dark) !important;
}
/* Some internal wrappers may inject inline white backgrounds; force override */
#redoc-container :deep(.redoc-wrap > div) { background: transparent !important; }
[data-theme="dark"] #redoc-container :deep(.redoc-wrap > div) { background: transparent !important; }
#redoc-container :deep(.sACRO) { /* Internal Redoc wrapper that was forcing white background */
  background: var(--color-bg-light) !important;
}
[data-theme="dark"] #redoc-container :deep(.sACRO) {
  background: var(--color-bg-dark) !important;
}
#redoc-container :deep(a) { color: var(--color-primary); }
#redoc-container :deep(a:hover) { color: var(--color-accent); }

/* Sidebar */
#redoc-container :deep(.menu-content) { border-right: 1px solid var(--color-border); background: transparent; }
#redoc-container :deep(.menu-content) { border-right: 1px solid var(--color-border); background: inherit; }
#redoc-container :deep(.menu-content li > a) { color: var(--color-text-light); opacity:.85; }
[data-theme="dark"] #redoc-container :deep(.menu-content li > a) { color: var(--color-text-dark); }
#redoc-container :deep(.menu-content li.active > a),
#redoc-container :deep(.menu-content li > a:hover) { color: var(--color-primary); opacity:1; }

/* Operation blocks */
#redoc-container :deep(section[id^="operation/"]) { background: transparent; border:1px solid rgba(0,0,0,0.06); border-radius:14px; padding:28px 30px 26px; margin:48px 0; }
[data-theme="dark"] #redoc-container :deep(section[id^="operation/"]) { border-color:#2a3340; background:#1a212c !important; box-shadow:0 2px 10px -2px rgba(0,0,0,.55); }
#redoc-container :deep(section[id^="operation/"] h1),
#redoc-container :deep(section[id^="operation/"] h2) { font-weight:600; letter-spacing:.3px; }

/* Response & schema panels */
#redoc-container :deep(.response) { background: transparent; }
#redoc-container :deep(.response .tab-header) { font-size: 12px; }
#redoc-container :deep(.response .code-wrapper) { border-radius:8px; overflow:hidden; }

/* Code blocks */
#redoc-container :deep(pre) { background:#0f1115 !important; color:#e6e6e6 !important; border:1px solid #1f2933 !important; }
[data-theme="dark"] #redoc-container :deep(pre) { background:#111b27 !important; border-color:#273544 !important; }
#redoc-container :deep(code) { font-family:SFMono-Regular,Menlo,Consolas,monospace; }
/* Request/response sample panels (often wrapped in .example, .example-panel, or .code-wrapper) */
[data-theme="dark"] #redoc-container :deep(.code-wrapper),
[data-theme="dark"] #redoc-container :deep(.response .code-wrapper),
[data-theme="dark"] #redoc-container :deep(.example),
[data-theme="dark"] #redoc-container :deep(.example-panel),
[data-theme="dark"] #redoc-container :deep(.response .tab-panel),
[data-theme="dark"] #redoc-container :deep(.tab-panel) {
  background:#111b27 !important;
  border:1px solid #273544 !important;
  box-shadow:0 1px 3px rgba(0,0,0,0.4) inset;
}
[data-theme="dark"] #redoc-container :deep(.code-wrapper pre),
[data-theme="dark"] #redoc-container :deep(.example pre) {
  background:#111b27 !important;
}
[data-theme="dark"] #redoc-container :deep(.example-title),
[data-theme="dark"] #redoc-container :deep(.example-label),
[data-theme="dark"] #redoc-container :deep(.tab-header),
[data-theme="dark"] #redoc-container :deep(.response .tab-header) {
  background:#1a2532 !important;
  color: var(--color-text-dark) !important;
  border-bottom:1px solid #273544 !important;
}
/* Catch any remaining Redoc sample/response containers that still have white backgrounds */
[data-theme="dark"] #redoc-container :deep(.response),
[data-theme="dark"] #redoc-container :deep(.example),
[data-theme="dark"] #redoc-container :deep(.example-panel),
[data-theme="dark"] #redoc-container :deep([class*="sample"]),
[data-theme="dark"] #redoc-container :deep([class*="Example"]),
[data-theme="dark"] #redoc-container :deep([class*="example"]),
[data-theme="dark"] #redoc-container :deep(.response-inner),
[data-theme="dark"] #redoc-container :deep(.responses-wrapper) {
  background: #111b27 !important;
}
/* Override inline style attribute backgrounds (e.g., style="background: #fff") within response section */
[data-theme="dark"] #redoc-container :deep(.response [style*="background"]),
[data-theme="dark"] #redoc-container :deep(.response [style*="background-color"]) {
  background: #111b27 !important;
  background-color: #111b27 !important;
}
/* React-tabs panels inside Redoc that still render white */
[data-theme="dark"] #redoc-container :deep(.react-tabs__tab-panel),
[data-theme="dark"] #redoc-container :deep(.cGfiwa > .react-tabs__tab-panel) {
  background:#111b27 !important;
  border:1px solid #273544 !important;
}
/* Styled-components generated class names (sample panel wrappers) */
[data-theme="dark"] #redoc-container :deep(.sc-EZqKI),
[data-theme="dark"] #redoc-container :deep(.iONckA) {
  background:#111b27 !important;
  border-color:#273544 !important;
}
/* Generic fallback for any styled-component root starting with sc- that still has a light background */
[data-theme="dark"] #redoc-container :deep([class^="sc-"]) {
  background: #111b27 !important;
}

/* Tables */
#redoc-container :deep(table) { font-size: 13px; background:transparent; }
#redoc-container :deep(th) { font-weight:600; background:rgba(0,0,0,0.04); }
[data-theme="dark"] #redoc-container :deep(th) { background:#1f2734; }
#redoc-container :deep(td),
#redoc-container :deep(th) { border:1px solid var(--color-border) !important; }

/* HTTP verb badges */
#redoc-container :deep(.http-verb) { border-radius:14px; padding:4px 10px; font-weight:600; letter-spacing:.5px; box-shadow:0 1px 2px rgba(0,0,0,.25); }
[data-theme="dark"] #redoc-container :deep(.http-verb) { box-shadow:none; }

/* Headings & body text adjustments */
#redoc-container :deep(h1) { font-size:30px; }
#redoc-container :deep(h2) { font-size:22px; margin-top:44px; }
#redoc-container :deep(h3) { font-size:17px; margin-top:30px; }
#redoc-container :deep(p) { line-height:1.55; max-width:78ch; }

/* Smooth transitions */
#redoc-container :deep(*) { transition: background-color .25s, color .25s, border-color .25s; }
#redoc-container :deep(.menu-item-depth-1 > a) { font-weight: 600; }

/* Cards / panels */
/* Removed invalid wildcard selector that could cause style parsing issues */
#redoc-container :deep(.response .tab-header) { font-size: 12px; }
#redoc-container :deep(code),
#redoc-container :deep(pre) { font-family: SFMono-Regular, Menlo, Consolas, monospace; }

/* Removed legacy .dark-mode overrides that re-applied light theme colors */

/* HTTP verb badge refinement */
#redoc-container :deep(.http-verb) {
  border-radius: 14px;
  padding: 2px 10px;
  font-weight: 600;
  letter-spacing: .5px;
}

/* Remove large default top margin for first heading */
#redoc-container :deep(.api-content > h1:first-child) { margin-top: 8px; }

/* Table refinements */
#redoc-container :deep(table) { font-size: 13px; }
#redoc-container :deep(th) { font-weight: 600; }

/* Raw spec monospace override already handled */
</style>

<!-- Removed second template and extra script block; toggle now declarative -->
