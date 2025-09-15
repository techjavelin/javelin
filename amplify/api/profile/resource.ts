import { defineFunction } from '@aws-amplify/backend';

// Functions will receive GRAPHQL_ENDPOINT via backend output/environment configuration at deploy time.
export const updateUserProfileSecure = defineFunction({
  name: 'update-user-profile-secure',
  entry: '../../functions/profile/update-user-profile-secure/handler.ts'
});

export const deleteUserProfileSecure = defineFunction({
  name: 'delete-user-profile-secure',
  entry: '../../functions/profile/delete-user-profile-secure/handler.ts'
});
