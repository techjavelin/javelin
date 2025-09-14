import { logger } from './logger'

let cached: string | null = null
let cachedSource: string | null = null

function extractFromEvent(event: any): string | null {
  if (!event) return null
  // Cognito triggers: event.userPoolId
  if (typeof event.userPoolId === 'string') return event.userPoolId
  // API Gateway authorizer claims / new HTTP API JWT shape
  const rc = event.requestContext?.authorizer
  const iss = rc?.claims?.iss || rc?.jwt?.claims?.iss || rc?.jwt?.issuer
  if (typeof iss === 'string') {
    const parts = iss.split('/')
    const candidate = parts[parts.length - 1]
    if (/^[a-z0-9-_]+$/.test(candidate)) return candidate
  }
  return null
}

/**
 * Resolve Cognito User Pool ID with precedence:
 * 1. Cached
 * 2. event.userPoolId (Cognito triggers)
 * 3. Issuer claim in API Gateway authorizer (iss)
 * 4. Environment variable AMPLIFY_AUTH_USER_POOL_ID
 * 5. amplify_outputs.json fallback
 */
export function getUserPoolId(event?: any): string {
  if (cached) return cached
  let userPoolId: string | null = null
  let source: string = 'none'

  const fromEvent = extractFromEvent(event)
  if (fromEvent) {
    userPoolId = fromEvent
    source = 'event'
  }

  if (!userPoolId && process.env.AMPLIFY_AUTH_USER_POOL_ID) {
    userPoolId = process.env.AMPLIFY_AUTH_USER_POOL_ID
    source = 'env'
  }

  if (!userPoolId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const outputs = require('../../amplify_outputs.json')
      const fallback = outputs?.auth?.user_pool_id
      if (fallback) {
        userPoolId = fallback
        source = 'fallback'
      }
    } catch (e) {
      logger.debug('getUserPoolId fallback load failed', { error: (e as any)?.message })
    }
  }

  if (!userPoolId) {
    logger.error('getUserPoolId: resolution failed', { sourcesTried: ['event','env','fallback'] })
    throw new Error('User Pool ID not configured')
  }

  cached = userPoolId
  cachedSource = source
  logger.debug('getUserPoolId resolved', { source })
  return userPoolId
}

export function getUserPoolIdSource(): string | null {
  return cachedSource
}
