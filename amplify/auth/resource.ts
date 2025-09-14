import { defineAuth } from '@aws-amplify/backend';
import { listUsers, createUser, updateUser, deleteUser, resetUserPassword, inviteAdminUser, activateOrganizationAdmin } from '../api/admin/resource';
import { defineFunction } from '@aws-amplify/backend';

// Post confirmation trigger for auto-activating pending organization
export const postConfirmActivateOrg = defineFunction({
  name: 'post-confirm-activate-org',
  entry: '../functions/user-management/post-confirm/handler.ts'
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
  },
  groups: ["admin", "editor", "author"],
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
