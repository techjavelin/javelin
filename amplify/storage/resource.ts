import { defineStorage } from '@aws-amplify/backend';

// Blog / marketing assets (legacy bucket) - unchanged.
export const storage = defineStorage({
  name: 'blogAssets',
  access: (allow) => ({
    'public/*': [allow.guest.to(['read']), allow.authenticated.to(['read','write','delete'])],
  })
});

// New internal artifact uploads bucket.
export const artifactsStorage = defineStorage({
  name: 'artifacts',
  access: (allow) => ({
    'artifacts/*': [
      allow.groups(['admin']).to(['read','write','delete']),
      allow.groups(['pentester']).to(['read','write','delete']),
      allow.authenticated.to(['read'])
    ]
  })
});
