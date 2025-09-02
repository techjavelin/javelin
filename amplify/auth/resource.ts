import { defineAuth } from '@aws-amplify/backend';
import { listUsers, createUser, updateUser, deleteUser, resetUserPassword } from '../api/admin/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
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
  ]
});
