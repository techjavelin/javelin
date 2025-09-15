#!/usr/bin/env ts-node
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

export interface EnumValidationResult {
  enums: string[]
  missing: string[]
}

export function collectEnums(modelsPath: string): string[] {
  const files = readdirSync(modelsPath).filter(f => f.endsWith('.model.ts'))
  const names: string[] = []
  const regex = /export const (\w+) = a\.enum\(/g
  for (const file of files) {
    const content = readFileSync(join(modelsPath, file), 'utf8')
    let m: RegExpExecArray | null
    while ((m = regex.exec(content)) !== null) names.push(m[1])
  }
  return names
}

export function validateEnums(rootDir = process.cwd()): EnumValidationResult {
  const modelsDir = join(rootDir, 'amplify', 'data', 'models')
  const resourceFile = join(rootDir, 'amplify', 'data', 'resource.ts')
  const enumNames = collectEnums(modelsDir)
  const resourceContent = readFileSync(resourceFile, 'utf8')
  const missing: string[] = []
  for (const en of enumNames) {
    const pattern = new RegExp(`\\b${en}\\b`)
    if (!pattern.test(resourceContent)) missing.push(en)
  }
  return { enums: enumNames, missing }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { missing } = validateEnums()
  if (missing.length) {
    console.error('[enum-validation] Missing enum registrations:', missing.join(', '))
    process.exit(1)
  } else {
    console.log('[enum-validation] All enums registered.')
  }
}
