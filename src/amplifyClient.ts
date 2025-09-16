import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from 'aws-amplify/utils';
// In normal runtime this static import is fine. During isolated unit tests (CI) the
// generated `amplify_outputs.json` may not exist (frontend bundle not built yet).
// We attempt a dynamic require guarded in try/catch so tests can proceed with
// a minimal stub (only data API endpoint & region if needed).  This prevents
// vitest from throwing a hard module resolution error.
let outputs: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  outputs = require('../amplify_outputs.json');
} catch (e) {
  // Provide a very small stub so parseAmplifyConfig doesn't explode; models
  // calls are mocked in unit tests anyway. Keep shape shallow.
  // Guard against process not being defined in browser ESM bundles.
  const hasProcess = typeof process !== 'undefined' && !!(process as any).env;
  // Prefer Vite's import.meta.env if available (browser build), else process.env, else default.
  const viteEnvRegion = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_AWS_REGION) || undefined;
  const region = viteEnvRegion || (hasProcess ? (process as any).env.AWS_REGION : undefined) || 'us-east-1';
  outputs = {
    aws_project_region: region
  };
  // eslint-disable-next-line no-console
  if (hasProcess && (process as any).env.VITEST) console.warn('[Amplify] Using stub amplify_outputs.json for tests');
}
import type { Schema } from '../amplify/data/resource';

// Central auth-mode strategy:
// Backend defaultAuthorizationMode (in amplify/data/resource.ts) is now 'userPool'.
// That means any call without an explicit authMode must originate from an authenticated user.
// For genuinely public content (marketing/blog newsletter flows) we must explicitly opt-in
// via withPublic()/authMode:'apiKey'. Keeping helpers here makes future migrations (e.g. 
// adding OIDC or IAM modes) simpler and centralizes review of security-sensitive defaults.
//
// Helper usage guidelines:
//   withAuth()      -> Standard authenticated calls (implicitly userPool via DEFAULT_AUTH_MODE)
//   withUserAuth()  -> Explicit userPool (rarely needed now, kept for clarity in some mutations)
//   withPublic()    -> Deliberate public/apiKey access (blog lists, newsletter opt-in, etc.)
// Avoid passing authMode inside model input objects (must be separate options argument).
export const DEFAULT_AUTH_MODE: 'userPool' | undefined = 'userPool';

// If certain models should still be accessed publicly without auth, explicitly call withPublic().
// Maintain a reference list here to aid reviewers (purely informational; not enforced in code):
export const PUBLIC_READ_MODELS = [
  'BlogPost', 'Author', 'Comment', 'PostTag', 'PostCategory'
];

let _client: ReturnType<typeof generateClient<Schema>> | null = null;
let _configured = false;

function ensureConfigured() {
  if (_configured) return;
  try {
    // If Amplify already has a config, this call effectively merges; safe to call multiple times.
    const cfg = parseAmplifyConfig(outputs as any);
    Amplify.configure(cfg);
    _configured = true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Amplify] Failed to auto-configure before client generation', e);
  }
}

export function getClient(): ReturnType<typeof generateClient<Schema>> {
  if (!_client) {
    ensureConfigured();
    _client = generateClient<Schema>();
  }
  return _client;
}

// Helper to merge a provided options object with centralized default.
// Usage: client.models.BlogPost.list(withAuth({ filter: {...} }))
// For mutation style calls: client.models.BlogPost.create(data, withAuth())
export function withAuth<T extends Record<string, any> | undefined = undefined>(options?: T): T & { authMode?: typeof DEFAULT_AUTH_MODE } {
  return { ...(options as any), ...(DEFAULT_AUTH_MODE ? { authMode: DEFAULT_AUTH_MODE } : {}) };
}

// Explicit helper to force authenticated userPool mode even while default remains apiKey.
export function withUserAuth<T extends Record<string, any> = Record<string, any>>(options?: T) {
  const base = (options || {}) as Record<string, any>;
  return { ...base, authMode: 'userPool' } as T & { authMode: 'userPool' };
}

// Helper for explicitly marking a call as public/apiKey (for clarity if we flip defaults later).
export function withPublic<T extends Record<string, any> = Record<string, any>>(options?: T) {
  const base = (options || {}) as Record<string, any>;
  return { ...base, authMode: 'apiKey' } as T & { authMode: 'apiKey' };
}
