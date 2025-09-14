import { defineStorage } from '@aws-amplify/backend';

// Public storage for blog post images & draft assets.
// Future: consider adding a protected level for private author assets.
export const storage = defineStorage({
  name: 'blogAssets',
  // Default access: public read, authenticated write; unauthenticated write disabled for now.
  access: (allow) => ({
    'public/*': [allow.guest.to(['read']), allow.authenticated.to(['read','write','delete'])],
    // If we later need per-user private areas:
    // 'protected/{entity_id}/*': [allow.authenticated.to(['read','write','delete'])]
  })
});
