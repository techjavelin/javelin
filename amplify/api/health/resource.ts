import { defineFunction } from '@aws-amplify/backend'

export const health = defineFunction({
  name: 'health',
  entry: '../../functions/health/handler.ts'
})
