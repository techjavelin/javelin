#!/usr/bin/env ts-node

/**
 * Backfill impactLevel & likelihood on existing VulnerabilityTemplate and VulnerabilityFinding records
 * where missing, using risk derivation + CVSS vector heuristics.
 *
 * Usage: npx ts-node scripts/backfillRiskFields.ts
 */
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { deriveSeverityData } from '../src/services/risk';
import { withAuth } from '../src/amplifyClient';

const client = generateClient<Schema>();

async function backfillTemplates() {
  const res = await client.models.VulnerabilityTemplate.list(withAuth({}));
  const items = res.data || [];
  let updated = 0;
  for (const t of items) {
    if (!t) continue;
    if ((t as any).impactLevel && (t as any).likelihood) continue; // already has values
    const { likelihood, impactLevel, severity } = await deriveSeverityData({
      likelihood: (t as any).likelihood as any,
      impactLevel: (t as any).impactLevel as any,
      cvssVector: t.cvssVector || undefined
    });
    if (!likelihood && !impactLevel) continue;
    try {
      await client.models.VulnerabilityTemplate.update(withAuth({
        id: t.id,
        likelihood: likelihood || (t as any).likelihood,
        impactLevel: impactLevel || (t as any).impactLevel,
        severity: severity || t.severity,
      }));
      updated++;
    } catch (e) { console.warn('Template update failed', t.id, e); }
  }
  console.log(`Templates scanned: ${items.length}, updated: ${updated}`);
}

async function backfillFindings() {
  const res = await client.models.VulnerabilityFinding.list(withAuth({}));
  const items = res.data || [];
  let updated = 0;
  for (const f of items) {
    if (!f) continue;
    if ((f as any).impactLevel && (f as any).likelihood) continue;
    const { likelihood, impactLevel, severity } = await deriveSeverityData({
      likelihood: (f as any).likelihood as any,
      impactLevel: (f as any).impactLevel as any,
      cvssVector: f.cvssVector || undefined
    });
    if (!likelihood && !impactLevel) continue;
    try {
      await client.models.VulnerabilityFinding.update(withAuth({
        id: f.id,
        likelihood: likelihood || (f as any).likelihood,
        impactLevel: impactLevel || (f as any).impactLevel,
        severity: severity || f.severity,
      }));
      updated++;
    } catch (e) { console.warn('Finding update failed', f.id, e); }
  }
  console.log(`Findings scanned: ${items.length}, updated: ${updated}`);
}

(async ()=>{
  await backfillTemplates();
  await backfillFindings();
  console.log('Backfill complete');
})();
