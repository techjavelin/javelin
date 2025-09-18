#!/usr/bin/env tsx
/**
 * Guardrail: ensure docs/api/index.html stays a tiny stub (no bundled Redoc / giant vendor blobs).
 * Intended to be run in CI (npm run lint:apidocs) or locally.
 */
import { statSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MAX_BYTES = 8 * 1024 // 8KB upper bound for the stub
const FILE = resolve(process.cwd(), 'docs/api/index.html')

function fail(msg: string): never {
  console.error(`\n[apidocs:size] FAIL: ${msg}`)
  process.exit(1)
}

try {
  const st = statSync(FILE)
  if (st.size > MAX_BYTES) {
    fail(`docs/api/index.html is ${st.size} bytes (limit ${MAX_BYTES}). This file must remain a minimal stub; remove embedded bundles.`)
  }
  const text = readFileSync(FILE, 'utf8')
  // Simple heuristic: if it contains typical minified bundle markers or huge style blocks, reject.
  const redFlags = [
    '!function(', 'webpackJsonp', 'sourceMappingURL', '.ajv', '.CodeGen', '.sc-j', 'fontawesome-svg-core'
  ]
  const hits = redFlags.filter(f => text.includes(f))
  if (hits.length > 0) {
    fail(`Suspicious bundled content detected in stub (markers: ${hits.join(', ')}). Keep only a short explanatory HTML page.`)
  }
  console.log(`[apidocs:size] OK: ${st.size} bytes.`)
} catch (err: any) {
  fail(`Unable to stat/read ${FILE}: ${err.message}`)
}
