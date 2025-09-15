import type { MigrationDef } from './runner';
import { migration_001_seed_default_metadata } from './migrations_001_seed_default_metadata.js';
import { migration_002_add_pulse_products } from './migrations_002_add_pulse_products.js';

export const migrations: MigrationDef[] = [
  migration_001_seed_default_metadata,
  migration_002_add_pulse_products,
];

export const latestMigrationId = migrations.reduce((max, m) => Math.max(max, m.id), 0);
