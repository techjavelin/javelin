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
