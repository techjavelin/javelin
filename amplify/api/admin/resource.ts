import { defineFunction } from '@aws-amplify/backend'

// Define user management functions
export const listUsers = defineFunction({
  name: 'list-users',
  entry: '../functions/user-management/list-users/handler.ts'
})

export const createUser = defineFunction({
  name: 'create-user',
  entry: '../functions/user-management/create-user/handler.ts'
})

export const updateUser = defineFunction({
  name: 'update-user',
  entry: '../functions/user-management/update-user/handler.ts'
})

export const deleteUser = defineFunction({
  name: 'delete-user',
  entry: '../functions/user-management/delete-user/handler.ts'
})

export const resetUserPassword = defineFunction({
  name: 'reset-user-password',
  entry: '../functions/user-management/reset-password/handler.ts'
})
