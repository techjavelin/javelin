import { ref } from 'vue';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { fetchAuthSession } from 'aws-amplify/auth';

// NOTE: Custom secure mutations backed by Lambda resolvers (updateUserProfileSecure/deleteUserProfileSecure)
// are not part of the generated Data client schema automatically; you can invoke them via
// client.graphql if exposed through AppSync / custom operation naming. Here we assume they are
// available as GraphQL mutations with same names.

const client = generateClient<Schema>();

interface UpdateUserProfileInput {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
}

export function useUserProfile() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const profile = ref<Schema['UserProfile']['type'] | null>(null);

  async function load(username: string) {
    loading.value = true; error.value = null;
    try {
  // Model primary key expected to be 'id'; map username to id for fetch.
  const res = await client.models.UserProfile.get({ id: username });
      if (res.data) profile.value = res.data;
      else error.value = 'Profile not found';
    } catch (e: any) {
      error.value = e.message || 'Failed to load profile';
    } finally {
      loading.value = false;
    }
  }

  async function updateSecure(input: UpdateUserProfileInput) {
    loading.value = true; error.value = null;
    try {
      // Fallback: if the custom mutation is not yet mapped, log guidance.
      const mutation = `mutation UpdateUserProfileSecure($input: UpdateUserProfileSecureInput!) { updateUserProfileSecure(input: $input) { username displayName avatarUrl bio website updatedAt } }`;
      const res: any = await client.graphql({ query: mutation, variables: { input } });
      const data = res.data?.updateUserProfileSecure;
      if (data) profile.value = data;
      else error.value = 'No data returned';
    } catch (e: any) {
      error.value = e.errors?.[0]?.message || e.message || 'Update failed';
    } finally { loading.value = false; }
  }

  async function deleteSecure(username: string) {
    loading.value = true; error.value = null;
    try {
      const mutation = `mutation DeleteUserProfileSecure($username: String!) { deleteUserProfileSecure(username: $username) { deleted username } }`;
      const res: any = await client.graphql({ query: mutation, variables: { username } });
      const ok = res.data?.deleteUserProfileSecure?.deleted;
      if (ok) profile.value = null; else error.value = 'Delete not confirmed';
    } catch (e: any) {
      error.value = e.errors?.[0]?.message || e.message || 'Delete failed';
    } finally { loading.value = false; }
  }

  async function currentUsername(): Promise<string | null> {
    try { const session = await fetchAuthSession(); return session?.tokens?.idToken?.payload?.['cognito:username'] as string || null; } catch { return null; }
  }

  return { profile, loading, error, load, updateSecure, deleteSecure, currentUsername };
}
