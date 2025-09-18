#!/usr/bin/env tsx
import { cp } from 'fs/promises'
import { resolve } from 'path'

async function main() {
  const src = resolve(process.cwd(), 'docs/api/openapi.yaml')
  const dest = resolve(process.cwd(), 'public/openapi.yaml')
  await cp(src, dest)
  console.log('[copy-openapi-spec] copied openapi.yaml -> public/openapi.yaml')
}

main().catch(e => { console.error(e); process.exit(1) })
