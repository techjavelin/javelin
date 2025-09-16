import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from 'aws-amplify/utils';
import { getAmplifyOutputs } from '../../outputs';
import type { Schema } from '../resource';
import { migrations } from './index.js';

// Simple FNV-1a hash for checksum (deterministic, lightweight)
function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ('0000000' + (h >>> 0).toString(16)).slice(-8);
}
// Logging
export interface MigrationLogger {
  level: 'silent' | 'info' | 'debug';
  info: (msg: string, meta?: Record<string, any>) => void;
  debug: (msg: string, meta?: Record<string, any>) => void;
  error: (msg: string, meta?: Record<string, any>) => void;
}

function createLogger(): MigrationLogger {
  const level = (process.env.MIGRATIONS_LOG_LEVEL || 'info') as MigrationLogger['level'];
  function base(kind: 'info'|'debug'|'error', msg: string, meta?: Record<string, any>) {
    if (level === 'silent') return;
    if (kind === 'debug' && level !== 'debug') return;
    const line = `[migrations] ${msg}`;
    if (kind === 'error') console.error(line, meta || '');
    else console.log(line, meta || '');
  }
  return {
    level,
    info: (m, meta) => base('info', m, meta),
    debug: (m, meta) => base('debug', m, meta),
    error: (m, meta) => base('error', m, meta),
  };
}

export type MigrationRunSummary = {
  attempted: number;
  applied: number;
  skipped: number;
  failed?: { id: number; name: string; error: string };
  latestId: number;
};

// External storage adapter (e.g., DynamoDB table via Lambda) to decouple from Data model writes
export interface MigrationStorageAdapter {
  listAppliedIds: () => Promise<{ ids: number[] }>;
  recordApplied: (m: { id: number; name: string; checksum: string }) => Promise<void>;
}

export interface RunMigrationsOptions {
  logger?: MigrationLogger;
  skipOnConfigError?: boolean; // if true, swallow config errors during infra synth
  storageAdapter?: MigrationStorageAdapter; // if provided, bypass client.models.Migration usage
}

export async function runMigrations(opts: RunMigrationsOptions = {}): Promise<MigrationRunSummary> {
  const logger = opts.logger || createLogger();
  // Ensure Amplify configured (during CDK synth this may lack full categories)
  try {
    if (!(Amplify as any)._config) {
  const cfg = parseAmplifyConfig(getAmplifyOutputs() as any);
      Amplify.configure(cfg);
    }
  } catch (e:any) {
    if (opts.skipOnConfigError) {
      logger.error('Skipping migrations - Amplify configure failed', { error: e?.message });
      return { attempted: 0, applied: 0, skipped: 0, failed: undefined, latestId: migrations[migrations.length - 1]?.id || 0 };
    }
    throw e;
  }

  const client = generateClient<Schema>();
  logger.info('Starting migration run', { total: migrations.length });
  const startTs = Date.now();
  let appliedIds: Set<number>;
  if (opts.storageAdapter) {
    const { ids } = await opts.storageAdapter.listAppliedIds();
    appliedIds = new Set(ids);
  } else {
    const applied = await client.models.Migration.list({});
    appliedIds = new Set((applied.data || []).map(m => m?.id));
  }
  logger.debug('Loaded applied migrations', { count: appliedIds.size });

  let appliedCount = 0;
  let skippedCount = 0;
  let failed: MigrationRunSummary['failed'];

  for (const m of migrations) {
    if (appliedIds.has(m.id)) {
      skippedCount++; logger.debug('Skip already applied', { id: m.id, name: m.name }); continue;
    }
    const checksum = fnv1a(m.name + (m.bodyHash || ''));
    logger.info(`Applying #${m.id} ${m.name}`);
    try {
      await m.up(client);
      if (opts.storageAdapter) {
        await opts.storageAdapter.recordApplied({ id: m.id, name: m.name, checksum });
      } else {
        await client.models.Migration.create({ id: m.id, name: m.name, appliedAt: new Date().toISOString(), checksum });
      }
      appliedCount++;
      logger.info(`Applied #${m.id} ${m.name}`, { checksum });
    } catch (err: any) {
      failed = { id: m.id, name: m.name, error: err?.message || String(err) };
      logger.error(`Failed #${m.id} ${m.name}`, { error: failed.error });
      break; // stop chain
    }
  }

  const durationMs = Date.now() - startTs;
  logger.info('Migration run complete', { applied: appliedCount, skipped: skippedCount, failed: failed ? 1 : 0, durationMs });
  return { attempted: migrations.length, applied: appliedCount, skipped: skippedCount, failed, latestId: migrations[migrations.length - 1]?.id || 0 };
}

export type MigrationDef = {
  id: number; // incremental version
  name: string;
  up: (client: ReturnType<typeof generateClient<Schema>>) => Promise<void>;
  bodyHash?: string; // optional stable body string used in checksum
};
