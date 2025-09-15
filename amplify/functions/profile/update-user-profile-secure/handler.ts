import { graphqlRequest } from '../graphqlClient';

// Whitelist of mutable fields (avoid accidental privilege or ownership changes)
const ALLOWED_FIELDS = [
  'displayName',
  'avatarUrl',
  'bio',
  'website'
 ] as const;

interface UpdateEvent {
  arguments: { input: { username: string; displayName?: string; avatarUrl?: string; bio?: string; website?: string } };
  identity?: { username?: string; groups?: string[] };
}

export const handler = async (event: UpdateEvent) => {
  const { identity } = event;
  const input = event.arguments?.input;
  if (!identity?.username) {
    return unauthorized('Missing identity');
  }
  if (!input?.username) {
    return userError('username is required');
  }
  const actingUser = identity.username;
  const isAdmin = identity.groups?.includes('admin') || false;

  if (!isAdmin && actingUser !== input.username) {
    return unauthorized('Cannot modify another user profile');
  }

  // Build update patch only with allowed fields
  const patch: Record<string, any> = {};
  for (const field of ALLOWED_FIELDS) {
    const value = (input as any)[field];
    if (value !== undefined) {
      patch[field] = value;
    }
  }
  if (Object.keys(patch).length === 0) {
    return userError('No allowed fields provided');
  }

  // 1. Query existing profile
  const getQuery = `query GetUserProfile($username: String!) { getUserProfile(username: $username) { username displayName avatarUrl bio website } }`;
  const getRes = await graphqlRequest<{ getUserProfile?: any }>(getQuery, { username: input.username });
  if (getRes.errors?.length) {
    return internalError('Lookup failed', getRes.errors);
  }
  if (!getRes.data?.getUserProfile) {
    return userError('Profile not found');
  }

  // 2. Perform update
  const mutation = `mutation UpdateUserProfile($input: UpdateUserProfileInput!) { updateUserProfile(input: $input) { username displayName avatarUrl bio website updatedAt } }`;
  const updateRes = await graphqlRequest<{ updateUserProfile?: any }>(mutation, { input: { username: input.username, ...patch } });
  if (updateRes.errors?.length) {
    return internalError('Update failed', updateRes.errors);
  }
  return updateRes.data?.updateUserProfile;
};

function unauthorized(message: string) {
  return { errorType: 'Unauthorized', message };
}
function userError(message: string) {
  return { errorType: 'UserInputError', message };
}
function internalError(message: string, details?: unknown) { return { errorType: 'InternalError', message, details }; }
