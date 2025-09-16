// Central list of functional (non-essential) client-side storage keys.
// Update this if additional personalization keys are introduced.
export const FUNCTIONAL_STORAGE_KEYS = [
  'user-theme',
  'cp.recents.v1',
  'cp.hideUnauthorized.v1',
  'adminSidebarCollapsed',
  'appSidebarCollapsed',
  'sigintSidebarCollapsed'
]

// Helper to clear functional personalization (does NOT modify consent record).
export function clearFunctionalStorage(){
  FUNCTIONAL_STORAGE_KEYS.forEach(k=>{ try { localStorage.removeItem(k) } catch {/* ignore */} })
}
