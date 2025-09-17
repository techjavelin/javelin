// Centralized helper to safely load amplify_outputs.json in backend build & synth contexts.
// Updated: use ESM-safe fs loading instead of CommonJS require so it works under "type": "module".
// If the file is missing (early pipeline phases) we return a stub and mark stub=true so callers can
// decide to skip work (e.g. migrations during CDK synth / pre-deploy).

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

let cached: any | null = null;
let stub = false;

function resolveOutputsPath(): string {
  // Allow override (useful for tests or custom CI layouts)
  const override = process.env.AMPLIFY_OUTPUTS_PATH;
  if (override) return override;
  // Path of this file: <repo>/amplify/outputs.ts -> outputs JSON sits at root: <repo>/amplify_outputs.json
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return resolve(__dirname, '../amplify_outputs.json');
}

export function getAmplifyOutputs(): any {
  if (cached) return cached;
  const path = resolveOutputsPath();
  if (!existsSync(path)) {
    stub = true;
    cached = { aws_project_region: process.env.AWS_REGION || 'us-east-1' };
    return cached;
  }
  try {
    const raw = readFileSync(path, 'utf-8');
    cached = JSON.parse(raw);
  } catch (e) {
    // If parse or read fails, degrade gracefully but mark stub so higher layers can skip.
    stub = true;
    cached = { aws_project_region: process.env.AWS_REGION || 'us-east-1' };
  }
  return cached;
}

export function isAmplifyOutputsStub(): boolean { return stub; }
