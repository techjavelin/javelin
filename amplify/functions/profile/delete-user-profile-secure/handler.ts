import { graphqlRequest } from '../graphqlClient';

interface DeleteEvent { arguments: { username: string }; identity?: { username?: string; groups?: string[] } }

export const handler = async (event: DeleteEvent) => {
  const { identity } = event;
  const targetUsername = event.arguments?.username;
  if (!identity?.username) {
    return unauthorized('Missing identity');
  }
  if (!targetUsername) {
    return userError('username is required');
  }
  const actingUser = identity.username;
  const isAdmin = identity.groups?.includes('admin') || false;

  if (!isAdmin && actingUser !== targetUsername) {
    return unauthorized('Cannot delete another user profile');
  }

  // Query to ensure existence
  const getQuery = `query GetUserProfile($username: String!) { getUserProfile(username: $username) { username } }`;
  const getRes = await graphqlRequest<{ getUserProfile?: any }>(getQuery, { username: targetUsername });
  if (getRes.errors?.length) {
    return internalError('Lookup failed', getRes.errors);
  }
  if (!getRes.data?.getUserProfile) {
    return userError('Profile not found');
  }
  const mutation = `mutation DeleteUserProfile($input: DeleteUserProfileInput!) { deleteUserProfile(input: $input) { username } }`;
  const delRes = await graphqlRequest<{ deleteUserProfile?: any }>(mutation, { input: { username: targetUsername } });
  if (delRes.errors?.length) {
    return internalError('Delete failed', delRes.errors);
  }
  return { deleted: true, username: targetUsername };
};

function unauthorized(message: string) {
  return { errorType: 'Unauthorized', message };
}
function userError(message: string) {
  return { errorType: 'UserInputError', message };
}
function internalError(message: string, details?: unknown) {
  return { errorType: 'InternalError', message, details };
}
