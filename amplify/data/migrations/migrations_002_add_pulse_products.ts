import type { MigrationDef } from './runner.js';
import type { Schema } from '../resource';
import { generateClient } from 'aws-amplify/data';

// Migration 002: Add Pulse SigInt & Pulse Portal products + standard service levels (FREE, PRO, ENTERPRISE)
export const migration_002_add_pulse_products: MigrationDef = {
  id: 2,
  name: 'add_pulse_products',
  bodyHash: 'pulse_products_and_service_levels_v1',
  up: async () => {
    const client = generateClient<Schema>();

    // Helper to get or create by natural key on Product.key
    async function ensureProduct(key: string, name: string, description: string){
      const existing = await client.models.Product.list({ filter: { key: { eq: key } }, authMode: 'userPool' });
      if((existing.data || []).some(p => p?.key === key)) return;
      await client.models.Product.create({ key, name, description, active: true }, { authMode: 'userPool' });
    }

    // Helper for ServiceLevel
    async function ensureServiceLevel(key: string, name: string, description: string, rank: number){
      const existing = await client.models.ServiceLevel.list({ filter: { key: { eq: key } }, authMode: 'userPool' });
      if((existing.data || []).some(sl => sl?.key === key)) return;
      await client.models.ServiceLevel.create({ key, name, description, rank, active: true }, { authMode: 'userPool' });
    }

    // Products
    await ensureProduct('PULSE_SIGINT', 'Pulse SigInt', 'Signals Intelligence collection & analytics platform');
    await ensureProduct('PULSE_PORTAL', 'Pulse Portal', 'Unified Pulse web portal for management & insights');

    // Standard service levels (global, not per-product in current schema)
    await ensureServiceLevel('FREE', 'Free', 'Community / evaluation tier', 1);
    await ensureServiceLevel('PRO', 'Pro', 'Professional subscription tier', 2);
    await ensureServiceLevel('ENTERPRISE', 'Enterprise', 'Enterprise-grade tier with advanced features', 3);
  }
};
