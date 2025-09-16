import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

describe('auth wrapper lint script', () => {
  it('reports no violations', () => {
    const script = join(process.cwd(), 'scripts', 'check-auth-wrappers.ts')
    const res = spawnSync('npx', ['tsx', script], { encoding: 'utf8' })
    // If script exits non-zero we capture error output
    if(res.status !== 0){
      throw new Error('Auth wrapper lint failed:\n'+res.stderr+res.stdout)
    }
    expect(res.stdout).toMatch(/No violations/)
  })
})
