// Centralized helper to safely load amplify_outputs.json in backend build & synth contexts.
// During certain amplify pipeline phases (earlier than outputs generation) the file may not exist.
// We swallow errors and return a minimal stub so code referencing optional custom fields can proceed.

let cached: any | null = null;
let stub = false;
export function getAmplifyOutputs(): any {
  if (cached) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cached = require('../amplify_outputs.json');
  } catch (e) {
    stub = true;
    cached = { aws_project_region: process.env.AWS_REGION || 'us-east-1' };
  }
  return cached;
}

export function isAmplifyOutputsStub(): boolean { return stub; }
