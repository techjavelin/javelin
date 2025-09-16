// Global test setup.
// Expose a marker and any lightweight polyfills that don't require jsdom.
// Individual DOM-heavy tests opt into jsdom via per-file directive.
if (!process.env.VITEST) {
  process.env.VITEST = '1';
}

// Example: stub matchMedia for components expecting it when using jsdom env.
if (typeof window !== 'undefined' && !window.matchMedia) {
  // @ts-ignore
  window.matchMedia = () => ({ matches: false, media: '', onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } });
}

// Central Amplify Auth mocks so individual tests don't duplicate.
import { vi } from 'vitest'
vi.mock('aws-amplify/auth', () => {
  return {
    getCurrentUser: vi.fn(async () => ({ userId: 'mock-user', signInDetails: { loginId: 'user@example.com'} })),
    fetchUserAttributes: vi.fn(async () => ({ email: 'user@example.com' })),
    updatePassword: vi.fn(async () => true),
    confirmSignIn: vi.fn(async () => true),
    setUpTOTP: vi.fn(async () => 'GLOBALMOCKSECRETGLOBALMOCKSECRET12'),
    verifyTOTPSetup: vi.fn(async () => true),
    updateMFAPreference: vi.fn(async () => true),
    fetchMFAPreference: vi.fn(async () => ({ enabled: [], preferred: undefined }))
  }
})

// Lightweight router mock to avoid getRoutes undefined in palette tests.
// We mock the default export from src/router (imported in useCommandPalette now).
vi.mock('../src/router', async () => {
  const routes = [
    { path: '/', name: 'home', meta: {} },
    { path: '/about', name: 'about', meta: {} },
    { path: '/blog', name: 'blog', meta: {} },
    { path: '/admin', name: 'admin-dashboard', meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/pentester', name: 'pentester-dashboard', meta: { requiresAuth: true, requiresPentester: true } },
    { path: '/profile', name: 'profile', meta: { requiresAuth: true } },
    { path: '/preferences', name: 'preferences', meta: { requiresAuth: true } }
  ,{ path: '/pentester/applications', name: 'pentester-applications', meta: { requiresAuth: true, requiresPentester: true } }
  ]
  return {
    default: {
      getRoutes: () => routes,
      afterEach: () => {},
      push: vi.fn()
    }
  }
})
