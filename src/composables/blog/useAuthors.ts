import { ref } from 'vue';
import type { Schema } from '../../../amplify/data/resource';
import { getClient, withUserAuth } from '../../amplifyClient';
import { useApi } from '../useApi';


type Author = Schema['Author']['type'];

export function useAuthors() {
  const client = getClient();
  const authors = ref<Author[]>([]);
  const currentAuthor = ref<Author | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const { withErrorToast } = useApi();

  const fetchAuthors = async () => {
    loading.value = true; error.value = null;
    try {
  const result = await withErrorToast('Load Authors', () => client.models.Author.list(withUserAuth()));
      authors.value = (result as any).data || [];
    } catch (err: any) { error.value = err.message || 'Failed to fetch authors'; }
    finally { loading.value = false; }
  };

  const fetchAuthorById = async (id: string) => {
    loading.value = true; error.value = null;
    try {
  const result = await withErrorToast('Load Author', () => client.models.Author.get({ id }, withUserAuth()));
      const data = (result as any).data || null;
      currentAuthor.value = data;
      return data;
    } catch (err: any) { error.value = err.message || 'Failed to fetch author'; return null; }
    finally { loading.value = false; }
  };

  const createAuthor = async (input: Partial<Author>) => {
    loading.value = true; error.value = null;
    try {
      const data = await withErrorToast('Create Author', async () => {
        if (!input.name || !input.email) throw new Error('Missing required fields: name, email');
        const { data } = await client.models.Author.create({
          name: input.name,
          email: input.email,
          bio: input.bio,
          avatarUrl: input.avatarUrl,
          owner: input.owner,
          joinedAt: input.joinedAt,
        }, withUserAuth());
        if (!data) throw new Error('Create author returned empty result');
        return data;
      });
      authors.value = [...authors.value, data];
      return data;
    } catch (err: any) { error.value = err.message || 'Failed to create author'; return null; }
    finally { loading.value = false; }
  };

  const updateAuthor = async (id: string, updates: Partial<Author>) => {
    loading.value = true; error.value = null;
    try {
      const data = await withErrorToast('Update Author', async () => {
  const { data } = await client.models.Author.update({ id, ...updates }, withUserAuth());
        return data;
      });
      if (data) {
        const idx = authors.value.findIndex(author => author.id === id);
        if (idx !== -1) authors.value[idx] = data as any;
        if (currentAuthor.value && currentAuthor.value.id === id) currentAuthor.value = data as any;
      }
      return data || null;
    } catch (err: any) { error.value = err.message || 'Failed to update author'; return null; }
    finally { loading.value = false; }
  };

  return {
    authors,
    currentAuthor,
    loading,
    error,
    fetchAuthors,
    fetchAuthorById,
    createAuthor,
    updateAuthor,
  };
}
