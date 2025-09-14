import { defineAuth, defineFunction } from '@aws-amplify/backend';
import { listUsers, createUser, updateUser, deleteUser, resetUserPassword, inviteAdminUser, activateOrganizationAdmin } from '../api/admin/resource';

// Post confirmation trigger for auto-activating pending organization
export const postConfirmActivateOrg = defineFunction({
  name: 'post-confirm-activate-org',
  entry: '../functions/user-management/post-confirm/handler.ts'
});

// Pre token trigger for entitlement claims
export const preTokenEntitlements = defineFunction({
  name: 'pre-token-entitlements',
  entry: '../functions/user-management/pre-token/handler.ts'
});

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  triggers: {
    postConfirmation: postConfirmActivateOrg,
    preTokenGeneration: preTokenEntitlements,
  },
  groups: ["admin", "editor", "author", "client"],
  userAttributes: {
    givenName: {
      required: false,
      mutable: true,
    },
    familyName: {
      required: false,
      mutable: true,
    },
  },
  access: (allow) => [
    allow.resource(listUsers).to(["manageUsers"]),
    allow.resource(createUser).to(["manageUsers"]),
    allow.resource(updateUser).to(["manageUsers"]),
    allow.resource(deleteUser).to(["manageUsers"]),
    allow.resource(resetUserPassword).to(["manageUsers"]),
    allow.resource(inviteAdminUser).to(["manageUsers"]),
    allow.resource(activateOrganizationAdmin).to(["manageUsers"]),
  ]
});
