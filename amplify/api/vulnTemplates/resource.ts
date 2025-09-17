import { defineFunction } from '@aws-amplify/backend';

export const vulnTemplates = defineFunction({
  name: 'vuln-templates',
  entry: '../../functions/vuln-templates/handler.ts'
});
