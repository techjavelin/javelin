import { defineFunction } from '@aws-amplify/backend';

export const userApiKeys = defineFunction({
  name: 'user-api-keys',
  entry: '../../functions/user-api-keys/handler.ts'
});
