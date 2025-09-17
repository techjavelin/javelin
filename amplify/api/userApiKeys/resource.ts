import { defineFunction } from '@aws-amplify/backend';

// Provide the usage plan name via environment for type-safe access in handler.
// Default remains the static name used in backend (dev safe).
export const userApiKeys = defineFunction({
  name: 'user-api-keys',
  entry: '../../functions/user-api-keys/handler.ts',
  environment: {
    USER_API_KEYS_USAGE_PLAN_NAME: 'UserApiKeysUsagePlan'
  }
});
