#!/usr/bin/env ts-node
/*
 Simple integration check for the public health endpoint and CORS preflight.
 Usage (after deploy):
   npx ts-node scripts/check-api-health.ts --base https://<restApiId>.execute-api.<region>.amazonaws.com/dev
 or add npm script: "test:integration": "tsx scripts/check-api-health.ts"
*/

import https from 'node:https'
import { URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

interface Args { base?: string }

function parseArgs(): Args {
  const baseIndex = process.argv.findIndex(a => a === '--base')
  if (baseIndex !== -1 && process.argv[baseIndex + 1]) {
    return { base: process.argv[baseIndex + 1].replace(/\/$/, '') }
  }
  return {}
}

function deriveBase(): string {
  // 1. CLI flag has highest precedence
  const { base: cliBase } = parseArgs()
  if (cliBase) {
    return cliBase
  }

  // 2. Environment variable (kept for backwards compatibility / overrides)
  if (process.env.VITE_ADMIN_API_BASE) {
    return process.env.VITE_ADMIN_API_BASE.replace(/\/$/, '')
  }

  // 3. amplify_outputs.json (preferred automatic discovery)
  const outputsPath = path.resolve(process.cwd(), 'amplify_outputs.json')
  if (fs.existsSync(outputsPath)) {
    try {
      const raw = fs.readFileSync(outputsPath, 'utf8')
      const json = JSON.parse(raw)
      const apiSection = json?.custom?.API
      if (apiSection && typeof apiSection === 'object') {
        // Prefer explicitly named "Sigint API" if present; else first entry
        const preferred = apiSection['Sigint API'] || Object.values(apiSection)[0]
        const endpoint = (preferred as any)?.endpoint || Object.values(apiSection).map((v: any) => v?.endpoint).find((e: any) => e)
        if (endpoint) {
          return String(endpoint).replace(/\/$/, '')
        }
      }
    } catch (err) {
      console.warn('Failed to parse amplify_outputs.json for API endpoint:', err)
    }
  }

  console.error('Unable to determine API base. Provide with --base <url> or set VITE_ADMIN_API_BASE or ensure amplify_outputs.json has custom.API entries.')
  process.exit(1)
}

function request(method: string, urlStr: string, headers: Record<string, string> = {}): Promise<{ status: number; headers: Record<string,string | string[]>; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr)
    const opts: https.RequestOptions = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers
    }
    const req = https.request(opts, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, headers: res.headers as any, body: data })
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function main() {
  const base = deriveBase()
  const healthUrl = `${base}/health`
  console.log('Checking GET', healthUrl)
  const getRes = await request('GET', healthUrl)
  if (getRes.status !== 200) {
    console.error('Health GET failed', getRes.status, getRes.body)
    process.exit(1)
  }
  try {
    const parsed = JSON.parse(getRes.body)
    if (parsed.status !== 'ok') {
      console.error('Unexpected health payload', parsed)
      process.exit(1)
    }
  } catch (e) {
    console.error('Failed to parse health JSON', e)
    process.exit(1)
  }
  console.log('Health OK')

  console.log('Checking CORS preflight OPTIONS /invite-admin-user')
  const optionsRes = await request('OPTIONS', `${base}/invite-admin-user`, {
    'Origin': 'http://localhost:5173',
    'Access-Control-Request-Method': 'POST'
  })
  const allowOrigin = optionsRes.headers['access-control-allow-origin']
  if (!allowOrigin) {
    console.error('Missing Access-Control-Allow-Origin on preflight response')
    process.exit(1)
  }
  const allowMethods = optionsRes.headers['access-control-allow-methods']
  if (!allowMethods || (Array.isArray(allowMethods) ? allowMethods.join(',') : allowMethods).toUpperCase().indexOf('POST') === -1) {
    console.error('Preflight does not list POST in Access-Control-Allow-Methods')
    process.exit(1)
  }
  console.log('CORS Preflight OK')
  console.log('All checks passed')
}

main().catch(err => {
  console.error('Integration check failed', err)
  process.exit(1)
})
