import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from 'aws-amplify/utils';
import outputs from '../amplify_outputs.json';
import type { Schema } from '../amplify/data/resource';

// Central place to adjust the default auth mode used across the app.
// Currently many composables explicitly specify { authMode: 'userPool' } on calls
// because backend defaultAuthorizationMode is apiKey to allow public read of
// certain blog-related models. If we later flip backend default to userPool
// we can remove most explicit overrides and optionally set FALLBACK_AUTH_MODE
// to 'apiKey' only for public list/read needs.
export const DEFAULT_AUTH_MODE: 'userPool' | undefined = undefined; // undefined lets Amplify pick project default

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
