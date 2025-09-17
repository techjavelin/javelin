#!/usr/bin/env tsx
/**
 * CI Migration Orchestrator
 *
 * Purpose: Execute backend data migrations explicitly at the end of the CI/CD pipeline
 * (after infrastructure (ampx pipeline-deploy) has been synthesized & deployed).
 *
 * Behavior:
 *  - Loads Amplify outputs (fails fast if missing)
 *  - Invokes runMigrations() using the Data model-based storage (Migration model)
 *  - Emits structured logs & a concise summary line for pipeline visibility
 *  - Exits non-zero if any migration fails (to halt deployment / subsequent steps)
 *
 * Flags (optional):
 *  --silent        Suppress info logs (only summary / errors)
 *  --debug         Verbose debug logging (overrides --silent)
 *  --json          Emit final summary JSON to stdout (in addition to logs)
 *
 * Future extension idea: add --since <id> to only consider > id range or support dry-run diff mode.
 */
import { runMigrations } from '../amplify/data/migrations/runner';
import { getAmplifyOutputs, isAmplifyOutputsStub } from '../amplify/outputs';

interface CliArgs { silent?: boolean; debug?: boolean; json?: boolean }

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const flags: CliArgs = {};
  for (const a of args) {
    if (a === '--silent') flags.silent = true;
    if (a === '--debug') { flags.debug = true; flags.silent = false; }
    if (a === '--json') flags.json = true;
  }
  return flags;
}

async function main(){
  const flags = parseArgs();
  if (isAmplifyOutputsStub()) {
    console.error('[migrate] amplify_outputs.json not found – ensure pipeline-deploy ran before migrations.');
    process.exit(1);
  }
  // Validate outputs structure early
  try { getAmplifyOutputs(); } catch (e:any) {
    console.error('[migrate] Failed to load amplify outputs:', e?.message || e);
    process.exit(1);
  }

  const level = flags.debug ? 'debug' : (flags.silent ? 'silent' : 'info');
  const lines: string[] = [];
  const logger = {
    level: level as any,
    info: (msg: string, meta?: Record<string,any>) => { if(level!=='silent') console.log(`[migrations] ${msg}`, meta || ''); lines.push(`${msg}`); },
    debug: (msg: string, meta?: Record<string,any>) => { if(level==='debug') console.log(`[migrations] ${msg}`, meta || ''); },
    error: (msg: string, meta?: Record<string,any>) => { console.error(`[migrations] ${msg}`, meta || ''); }
  };

  console.log('[migrate] Starting explicit migration run...');
  const summary = await runMigrations({ logger, skipOnConfigError: false });

  if (summary.failed) {
    console.error(`[migrate] FAILED migration #${summary.failed.id} ${summary.failed.name}: ${summary.failed.error}`);
    if (flags.json) process.stdout.write(JSON.stringify({ ok:false, summary }) + '\n');
    process.exit(1);
  }

  const statusLine = `[migrate] success applied=${summary.applied} skipped=${summary.skipped} latest=${summary.latestId}`;
  console.log(statusLine);
  if (flags.json) process.stdout.write(JSON.stringify({ ok:true, summary }) + '\n');
}

main().catch(e => {
  console.error('[migrate] Unexpected error', e);
  process.exit(1);
});
