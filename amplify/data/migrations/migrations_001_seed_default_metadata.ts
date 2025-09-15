import type { MigrationDef } from './runner.js';
import type { Schema } from '../resource';
import { generateClient } from 'aws-amplify/data';

// Migration 001: Seed default ApplicationType and UserType metadata (idempotent)
export const migration_001_seed_default_metadata: MigrationDef = {
  id: 1,
  name: 'seed_default_metadata',
  bodyHash: 'application_user_types_v1',
  up: async () => {
    const client = generateClient<Schema>();
    console.log('[migration 001] Starting seed_default_metadata');
    const defaultApplicationTypes: Array<Pick<Schema['ApplicationType']['type'],'key'|'label'|'description'|'rank'>> = [
      { key: 'web_app', label: 'Web Application', description: 'Browser-accessed application', rank: 1 },
      { key: 'api_service', label: 'API / Service', description: 'Backend or service API', rank: 2 },
      { key: 'mobile', label: 'Mobile App', description: 'iOS/Android mobile application', rank: 3 },
      { key: 'cloud', label: 'Cloud / Infra', description: 'Cloud or infrastructure component', rank: 4 },
      { key: 'other', label: 'Other', description: 'Other / miscellaneous application type', rank: 5 },
    ];
  
    const defaultUserTypes: Array<Pick<Schema['UserType']['type'],'key'|'label'|'description'|'rank'>> = [
      { key: 'customer', label: 'Customer', description: 'External customer users', rank: 1 },
      { key: 'employee', label: 'Employee', description: 'Internal employees', rank: 2 },
      { key: 'public', label: 'Public', description: 'General public audience', rank: 3 },
      { key: 'restricted', label: 'Restricted', description: 'Limited privileged users', rank: 4 },
    ];
  
    async function ensure<T extends { key?: string | null | undefined }>(
      items: Array<Pick<T,'key'> & Record<string, any>>,
      listFn: () => Promise<{ data: (T | null)[] | null }>,
      createFn: (input: any) => Promise<any>
    ) {
      const existing = await listFn();
      const existingByKey = new Set((existing.data || []).map(t => t?.key));
      for (const def of items) {
        if (!existingByKey.has(def.key)) {
          await createFn({ ...def, active: true });
        }
      }
    }
  
    // Use function resource-based auth (run-migrations) instead of userPool tokens when seeding.
    // This avoids needing a Cognito identity inside the lambda environment. Frontend still enforces userPool.
    try {
      console.log('[migration 001] Ensuring ApplicationType defaults');
      await ensure(defaultApplicationTypes, () => client.models.ApplicationType.list({ authMode: 'userPool' }), async (input)=> {
        console.log('[migration 001] Creating ApplicationType', input.key);
        return client.models.ApplicationType.create({ ...input }, { authMode: 'userPool' });
      })
      console.log('[migration 001] Ensuring UserType defaults');
      await ensure(defaultUserTypes, () => client.models.UserType.list({ authMode: 'userPool' }), async (input)=> {
        console.log('[migration 001] Creating UserType', input.key);
        return client.models.UserType.create({ ...input }, { authMode: 'userPool' });
      })
      console.log('[migration 001] Seed complete');
    } catch (e:any) {
      if(/No federated jwt/i.test(e?.message || '')) {
        console.warn('[migration 001] Skipping metadata seed - no federated JWT available (will require manual seed via admin UI)');
        return;
      }
      console.error('[migration 001] Error seeding metadata', e?.message || e);
      throw e;
    }
  }
};
