import { defineFunction } from '@aws-amplify/backend'

// Define user management functions
export const listUsers = defineFunction({
  name: 'list-users',
  entry: '../../functions/user-management/list-users/handler.ts'
})

export const createUser = defineFunction({
  name: 'create-user',
  entry: '../../functions/user-management/create-user/handler.ts'
})

export const updateUser = defineFunction({
  name: 'update-user',
  entry: '../../functions/user-management/update-user/handler.ts'
})

export const deleteUser = defineFunction({
  name: 'delete-user',
  entry: '../../functions/user-management/delete-user/handler.ts'
})

export const resetUserPassword = defineFunction({
  name: 'reset-user-password',
  entry: '../../functions/user-management/reset-password/handler.ts'
})

// Invite (or ensure) an admin user for an organization. This wraps create + add to groups
// but is organization-context aware via payload (handled in function implementation).
export const inviteAdminUser = defineFunction({
  name: 'invite-admin-user',
  entry: '../../functions/user-management/invite-admin-user/handler.ts'
})

export const activateOrganizationAdmin = defineFunction({
  name: 'activate-organization-admin',
  entry: '../../functions/user-management/activate-organization-admin/handler.ts'
})

// Migrations trigger function (admin only)
export const runMigrations = defineFunction({
  name: 'run-migrations',
  entry: '../../functions/migrations/run-migrations/handler.ts'
})

export const listMigrations = defineFunction({
  name: 'list-migrations',
  entry: '../../functions/migrations/list-migrations/handler.ts'
})
