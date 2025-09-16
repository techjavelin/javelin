// Amplify Gen2 function for MFA backup code redemption & regeneration (combined handler)
// Endpoint style: export handlers for POST /redeem and POST /regenerate (router wiring assumed by infra)
import { Schema } from "../../data/resource";
import { defineFunction } from '@aws-amplify/backend'
import { generateClient } from 'aws-amplify/data'
import { randomBytes, createHash } from 'crypto'
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms'

interface RedeemInput { userId: string; code: string }
interface RegenerateInput { userId: string; count?: number }

function base64Url(buf: Buffer){
  return buf.toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_')
}

function makeSalt(len=12){ return base64Url(randomBytes(len)) }

async function hashCode(userId: string, code: string, salt: string){
  const h = createHash('sha256')
  h.update(userId+':'+code+':'+salt)
  return base64Url(h.digest())
}

// In-memory rate limit: Map key = userId+action => { count, reset }
const rateState = new Map<string,{count:number; reset:number}>()
const WINDOW_MS = 60_000
const MAX_REDEEM_ATTEMPTS = 10
const MAX_REGENERATE = 3

// Optional encryption of salt at rest (demo only): XOR with derived key from ENV secret.
// For production use KMS envelope encryption.
const KMS_KEY_ID = process.env.KMS_BACKUP_CODE_KEY_ID
const FALLBACK_KEY = (process.env.BACKUP_CODE_SALT_KEY || 'local-dev-key').padEnd(32,'0').slice(0,32)
const kms = KMS_KEY_ID ? new KMSClient({}) : null
async function encSalt(s: string, userId: string){
  if(kms && KMS_KEY_ID){
    const cmd = new EncryptCommand({ KeyId: KMS_KEY_ID, Plaintext: Buffer.from(s), EncryptionContext: { userId } })
    const out = await kms.send(cmd)
    return Buffer.from(out.CiphertextBlob as Uint8Array).toString('base64')
  }
  // Fallback XOR
  const sb = Buffer.from(s)
  const kb = Buffer.from(FALLBACK_KEY)
  const ob = Buffer.alloc(sb.length)
  for(let i=0;i<sb.length;i++) ob[i] = sb[i] ^ kb[i % kb.length]
  return ob.toString('base64')
}
async function decSalt(e: string, userId: string){
  if(kms && KMS_KEY_ID){
    const cmd = new DecryptCommand({ CiphertextBlob: Buffer.from(e,'base64'), EncryptionContext: { userId } })
    const out = await kms.send(cmd)
    return Buffer.from(out.Plaintext as Uint8Array).toString()
  }
  const eb = Buffer.from(e,'base64')
  const kb = Buffer.from(FALLBACK_KEY)
  const ob = Buffer.alloc(eb.length)
  for(let i=0;i<eb.length;i++) ob[i] = eb[i] ^ kb[i % kb.length]
  return ob.toString()
}

function checkRate(userId: string, action: 'redeem'|'regenerate'){
  const key = userId+':'+action
  const now = Date.now()
  let st = rateState.get(key)
  if(!st || st.reset < now){ st = { count:0, reset: now + WINDOW_MS }; rateState.set(key, st) }
  st.count++
  const limit = action==='redeem'? MAX_REDEEM_ATTEMPTS : MAX_REGENERATE
  if(st.count > limit) return false
  return true
}

export async function handler(event: any) {
  const path = event.path || ''
  const method = event.httpMethod || 'POST'
  if(method !== 'POST') return { statusCode:405, body:'Method Not Allowed' }

  const body = event.body ? JSON.parse(event.body) : {}
  const client = generateClient<Schema>()

  if(path.endsWith('/redeem')){
    const { userId, code } = body as RedeemInput
    if(!userId || !code) return { statusCode:400, body: 'Missing userId or code' }
    // Identity enforcement (Cognito). event.requestContext.identity?.cognitoIdentityId placeholder; adjust depending on API GW mapping.
    const authUser = (event.requestContext?.authorizer as any)?.claims?.sub || (event.requestContext?.authorizer as any)?.jwt?.claims?.sub
    if(authUser && authUser !== userId){
      return { statusCode:403, body:'Forbidden' }
    }

    // List codes for user (Ideally query by hash directly after enumerating salts, but we need salts first)
    if(!checkRate(userId,'redeem')) return { statusCode:429, body:'Rate limit exceeded' }
    const list = await client.models.MfaBackupCode.list({ filter: { userId: { eq: userId }, used: { eq: false } } })
    const items = (list as any).data || (list as any).items || []
    for(const rec of items){
  const saltPlain = await decSalt(rec.salt, userId)
      const hash = await hashCode(userId, code, saltPlain)
      if(hash === rec.hash){
        await client.models.MfaBackupCode.update({ id: rec.id, used: true, usedAt: new Date().toISOString() })
        return { statusCode:200, body: JSON.stringify({ redeemed:true }) }
      }
    }
    return { statusCode:404, body: JSON.stringify({ redeemed:false }) }
  }

  if(path.endsWith('/regenerate')){
    const { userId, count = 10 } = body as RegenerateInput
    if(!userId) return { statusCode:400, body:'Missing userId' }
    const authUser = (event.requestContext?.authorizer as any)?.claims?.sub || (event.requestContext?.authorizer as any)?.jwt?.claims?.sub
    if(authUser && authUser !== userId){
      return { statusCode:403, body:'Forbidden' }
    }
    // Invalidate existing (mark used if not already)
    if(!checkRate(userId,'regenerate')) return { statusCode:429, body:'Rate limit exceeded' }
    const list = await client.models.MfaBackupCode.list({ filter: { userId: { eq: userId }, used: { eq: false } } })
    const items = (list as any).data || (list as any).items || []
    await Promise.all(items.map((rec:any)=> client.models.MfaBackupCode.update({ id: rec.id, used:true, usedAt:new Date().toISOString() })))
    // Generate new codes
    const newPlain: string[] = []
    for(let i=0;i<count;i++){
      const raw = base64Url(randomBytes(8)).replace(/-/g,'').slice(0,10).toUpperCase()
      const formatted = raw.slice(0,5)+'-'+raw.slice(5)
      newPlain.push(formatted)
      const salt = makeSalt(9)
      const hash = await hashCode(userId, formatted, salt)
  const storedSalt = await encSalt(salt, userId)
  await client.models.MfaBackupCode.create({ userId, hash, salt: storedSalt, used:false })
    }
    return { statusCode:200, body: JSON.stringify({ codes: newPlain }) }
  }

  return { statusCode:404, body:'Not Found' }
}

// NOTE: This file now acts both as implementation and (via defineFunction below) as definition.
// The entry path must be relative to amplify/backend.ts root resolution, so we point directly to this file.
export const backupCodes = defineFunction({
  name: 'mfa-backup-codes',
  // Entry must be relative to this file's directory when bundling; referencing './functions/mfa/...' caused a duplicated path segment.
  entry: './backupCodes.ts'
});

// For unit testing convenience
export const _backupCodesHandler = handler;
