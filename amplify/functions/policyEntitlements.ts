import { evaluateEntitlements } from './service/entitlements/evaluateEntitlements'
import { logger } from './logger'

export async function requireFeature(organizationId: string | undefined, featureKey: string) {
  if (!organizationId) {
    logger.warn('requireFeature:noOrgId', { featureKey })
    throw forbidden(featureKey)
  }
  const ent = await evaluateEntitlements(organizationId)
  if (!ent.featureKeys.includes(featureKey)) {
    logger.info('requireFeature:denied', { organizationId, featureKey })
    throw forbidden(featureKey)
  }
  logger.debug('requireFeature:granted', { organizationId, featureKey })
}

function forbidden(featureKey: string) {
  const e: any = new Error('Feature not enabled')
  e.statusCode = 403
  e.code = 'FEATURE_NOT_ENABLED'
  e.feature = featureKey
  return e
}
