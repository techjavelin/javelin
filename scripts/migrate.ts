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
import { Amplify } from 'aws-amplify';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

interface CliArgs { silent?: boolean; debug?: boolean; json?: boolean; outputsPath?: string }

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const flags: CliArgs = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--silent') flags.silent = true;
    else if (a === '--debug') { flags.debug = true; flags.silent = false; }
    else if (a === '--json') flags.json = true;
    else if (a === '--amplify-outputs') {
      const next = args[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('[migrate] --amplify-outputs flag requires a path argument');
        process.exit(1);
      }
      flags.outputsPath = next;
      i++; // skip path token
    }
  }
  return flags;
}

async function main(){
  const flags = parseArgs();
  // Load amplify_outputs.json directly (mirrors seed script approach; keep it simple)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const outputsPath = flags.outputsPath
    ? resolve(process.cwd(), flags.outputsPath)
    : resolve(__dirname, 'amplify_outputs.json');
  if (flags.outputsPath) {
    console.log('[migrate] Using custom amplify outputs path:', outputsPath);
  }
  if (!existsSync(outputsPath)) {
    console.error('[migrate] amplify_outputs.json not found at', outputsPath, '\nEnsure pipeline-deploy ran before migrations.');
    process.exit(1);
  }
  let outputs: any;
  try {
    outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
  } catch (e:any) {
    console.error('[migrate] Failed parsing amplify_outputs.json:', e?.message || e);
    process.exit(1);
  }
  Amplify.configure(outputs);

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
