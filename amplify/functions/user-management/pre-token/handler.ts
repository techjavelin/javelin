import { evaluateEntitlements } from '../../service/entitlements/evaluateEntitlements'
import { logger } from '../../logger'

// Cognito Pre Token Generation trigger shape (simplified for Amplify Gen2)
// event.request.userAttributes.sub contains user sub
// We assume a single organization context for now; future: derive from preferred_org or similar claim.

export const handler = async (event: any) => {
  try {
    const userSub = event?.request?.userAttributes?.sub
    // TODO: derive organization association. Placeholder: no org context -> skip enrichment.
    const orgId = event?.request?.userAttributes?.['custom:orgId']
    if (!orgId) {
      logger.debug('preToken:noOrgContext', { userSub })
      return event
    }
    const ent = await evaluateEntitlements(orgId)
    // Inject custom claims (keep them small)
    event.response = event.response || {}
    event.response.claimsOverrideDetails = event.response.claimsOverrideDetails || {}
    event.response.claimsOverrideDetails.claimsToAddOrOverride = {
      ...(event.response.claimsOverrideDetails.claimsToAddOrOverride || {}),
      ent_f: ent.featureKeys.join(','),
      ent_sl: ent.serviceLevelKey || '',
      ent_v: ent.versionHash,
      ent_org: orgId,
      ent_plan: ent.planId || ''
    }
    logger.debug('preToken:claimsInjected', { userSub, orgId, featureCount: ent.featureKeys.length })
    return event
  } catch (err: any) {
    logger.error('preToken:error', { message: err.message, stack: err.stack })
    return event // fail-open (token still issued without enrichment)
  }
}
