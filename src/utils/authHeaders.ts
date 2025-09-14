import { fetchAuthSession } from 'aws-amplify/auth'

/**
 * Builds Authorization headers for REST calls to Cognito-protected API Gateway methods.
 * Uses id token if present (user identity) otherwise falls back to access token.
 */
export async function buildAuthHeaders(extra: Record<string,string> = {}) {
  const session = await fetchAuthSession()
  const id = session.tokens?.idToken?.toString()
  const access = session.tokens?.accessToken?.toString()
  if (!id && !access) throw new Error('Not authenticated')
  return {
    'Authorization': `Bearer ${id || access}`,
    ...extra
  }
}
