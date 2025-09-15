# Data Migrations

This directory implements a light-weight ordered migration system for Amplify Data models.

## Concepts
- Migration records are stored in the `Migration` model with fields: `id`, `name`, `appliedAt`, `checksum`.
- Each migration has a numeric `id` (version). Migrations must be appended with strictly increasing ids.
- The runner loads applied ids and executes only pending migrations in order.
- A simple FNV-1a hash produces a checksum (based on name + optional `bodyHash`) for basic drift awareness.

## Adding a Migration
1. Create a new file: `migrations_XXX_description.ts` where `XXX` is zero-padded incremental number (e.g. `002_add_new_metadata`).
2. Export a `MigrationDef` object: `{ id: 2, name: 'add_new_metadata', up: async () => { /* logic */ } }`.
3. Append it to the `migrations` array in `index.ts` (order matters in code even if ids are numeric).
4. (Optional) Provide a stable `bodyHash` string if you want the checksum to change when logic meaningfully changes.
5. Commit model changes separately if the migration depends on new schema.

## Writing Migration Logic
- Use the generated client: `const client = generateClient<Schema>()` inside `up`.
- Keep migrations idempotent where possible: check before create/update to allow safe re-runs.
- Favor small, composable steps over large multi-purpose migrations.
- Avoid destructive deletes unless accompanied by a backup/export plan.

## When Migrations Run
- `backend.ts` calls `runMigrations()` during infrastructure definition, ensuring they run in each environment deployment.
- Frontend build can read the exposed backend output `MIGRATIONS.latest` if needed for compatibility checks.

## Logging
The runner outputs structured console lines prefixed with `[migrations]`.

Log levels (env var `MIGRATIONS_LOG_LEVEL`):
- `silent` – suppress all migration logs (errors still emitted by caller if thrown)
- `info` (default) – summary plus each applied migration
- `debug` – includes skip details and loaded state counts

Example (info level):
```
[migrations] Starting migration run { total: 3 }
[migrations] Applying #2 add_new_metadata
[migrations] Applied #2 add_new_metadata { checksum: "ab12cd34" }
[migrations] Migration run complete { applied: 1, skipped: 2, failed: 0, durationMs: 37 }
```

The function returns a `MigrationRunSummary` for programmatic inspection (applied, skipped, failed, latestId).

## Configuration Guard / Synth Behavior
During CDK/Amplify synth the GraphQL provider config may not yet be fully resolvable. The runner attempts to call `Amplify.configure()` itself. If configuration fails and `skipOnConfigError: true` is passed, migrations are skipped (a warning is logged) so infrastructure synthesis is not blocked. Deployment/runtime phases where config is available will then apply pending migrations.

You can force strict behavior (fail fast) by omitting `skipOnConfigError`.

Environment variable idea (not yet implemented): `RUN_MIGRATIONS=strict` could toggle this globally if needed.

## Safety & Drift
- The stored `checksum` lets you detect if a migration's implementation changed after being applied. If a divergence is detected (not yet automated), increment the id and create a new corrective migration instead of editing old history.

## Rollbacks
- Rollbacks are intentionally not automated. Create a forward corrective migration if you need to revert data changes.

## Example
See `migrations_001_seed_default_metadata.ts` which seeds initial ApplicationType and UserType entries.

---
Lightweight by design: if requirements grow (down migrations, dependency graphs, generated skeletons) this can be evolved into a formal CLI, but current scope favors simplicity.
