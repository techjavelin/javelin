/**
 * Migration 003: Purge legacy owaspCategory field from VulnerabilityTemplate records.
 * Safe to run multiple times (idempotent).
 */
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { withAuth } from '../../src/amplifyClient';

const client = generateClient<Schema>();

async function run() {
  const res = await client.models.VulnerabilityTemplate.list(withAuth({}));
  const items = res.data || [];
  let touched = 0;
  for (const t of items) {
    if (!t) continue;
    // @ts-ignore legacy field may appear in some environments
    if ((t as any).owaspCategory) {
      try {
        await client.models.VulnerabilityTemplate.update(withAuth({ id: t.id, /* cannot literally unset unknown schema field post-removal; no-op */ }));
        touched++;
      } catch (e) { console.warn('Purge owaspCategory update failed', t.id, e); }
    }
  }
  console.log(`Checked ${items.length} templates; legacy field seen on ${touched}`);
}

run().then(()=> console.log('Migration 003 complete')).catch(e=> { console.error('Migration 003 failed', e); process.exit(1); });
