#!/usr/bin/env tsx
/**
 * Copies the generated Redoc HTML (and any adjunct assets if present) into public/api
 * so that the Vue app can serve docs at /api.
 */
import { mkdir, cp } from 'fs/promises';
import { resolve } from 'path';

async function main() {
  const srcDir = resolve(process.cwd(), 'docs/api');
  const dstDir = resolve(process.cwd(), 'public/api');
  await mkdir(dstDir, { recursive: true });
  // Copy only index.html (currently single-file bundle) but allow future assets by copying all .html/.js/.css
  await cp(srcDir + '/index.html', dstDir + '/index.html');
}

main().catch(err => {
  console.error('[copy-api-docs] failed', err);
  process.exit(1);
});
