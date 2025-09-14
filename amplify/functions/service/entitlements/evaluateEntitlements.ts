import crypto from 'crypto'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../data/resource'

export interface EntitlementResult {
  organizationId: string
  planId?: string
  serviceLevelKey?: string
  featureKeys: string[]
  status?: string
  versionHash: string
  evaluatedAt: string
}

// Minimal cache (cold start scope only)
const memoryCache = new Map<string, EntitlementResult>()

export async function evaluateEntitlements(organizationId: string): Promise<EntitlementResult> {
  const cacheKey = organizationId
  const cached = memoryCache.get(cacheKey)
  if (cached) return cached

  const client = generateClient<Schema>()
  // 1. Load ACTIVE entitlement (simplistic: pick first ACTIVE)
  const entitlements = await client.models.OrganizationEntitlement.list({
    filter: { organizationId: { eq: organizationId }, status: { eq: 'ACTIVE' } },
    limit: 1
  })
  const active = entitlements.data?.[0]
  if (!active) {
    const empty: EntitlementResult = {
      organizationId,
      featureKeys: [],
      versionHash: hashParts([organizationId, 'none']),
      evaluatedAt: new Date().toISOString()
    }
    memoryCache.set(cacheKey, empty)
    return empty
  }

  // 2. Load plan
  const plan = await client.models.EntitlementPlan.get({ id: active.entitlementPlanId })
  const planData = plan.data
  const baseFeatures = (planData?.featureKeys?.filter((f): f is string => !!f) || [])

  // 3. Apply overrides
  const add = (active.overrides_addFeatures?.filter((f): f is string => !!f) || [])
  const remove = new Set((active.overrides_removeFeatures?.filter((f): f is string => !!f) || []))
  const finalSet: string[] = []
  for (const f of baseFeatures) if (typeof f === 'string' && !remove.has(f)) finalSet.push(f)
  for (const f of add) if (typeof f === 'string' && !finalSet.includes(f)) finalSet.push(f)

  // (Future: seat limits, expiry checks, suspended states, etc.)
  const versionHash = hashParts([
    organizationId,
    active.id,
    planData?.id || '',
    ...(finalSet.sort())
  ])

  const result: EntitlementResult = {
    organizationId,
    planId: planData?.id,
    serviceLevelKey: deriveServiceLevelKey(planData),
    featureKeys: finalSet.sort(),
  status: active.status || undefined,
    versionHash,
    evaluatedAt: new Date().toISOString()
  }
  memoryCache.set(cacheKey, result)
  return result
}

function deriveServiceLevelKey(plan?: Schema['EntitlementPlan']['type'] | null): string | undefined {
  // For now we rely on plan key naming convention PULSE_PRO -> service level after last underscore
  if (!plan?.key) return undefined
  const parts = plan.key.split('_')
  return parts[parts.length - 1]
}

function hashParts(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32)
}

// Quick feature check helper
export async function hasFeature(organizationId: string, featureKey: string): Promise<boolean> {
  const ent = await evaluateEntitlements(organizationId)
  return ent.featureKeys.includes(featureKey)
}
