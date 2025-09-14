import { ref } from 'vue';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';


type Author = Schema['Author']['type'];

export function useAuthors() {
  const client = generateClient<Schema>();
  const authors = ref<Author[]>([]);
  const currentAuthor = ref<Author | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchAuthors = async () => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await client.models.Author.list();
      authors.value = data || [];
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch authors';
    } finally {
      loading.value = false;
    }
  };

  const fetchAuthorById = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await client.models.Author.get({ id });
      currentAuthor.value = data || null;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch author';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const createAuthor = async (input: Partial<Author>) => {
    loading.value = true;
    error.value = null;
    try {
      if (!input.name || !input.email) {
        throw new Error('Missing required fields: name, email');
      }
      const { data } = await client.models.Author.create({
        name: input.name,
        email: input.email,
        bio: input.bio,
        avatarUrl: input.avatarUrl,
        owner: input.owner,
        joinedAt: input.joinedAt,
      });
      if (data) authors.value = [...authors.value, data];
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to create author';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateAuthor = async (id: string, updates: Partial<Author>) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await client.models.Author.update({ id, ...updates });
      const idx = authors.value.findIndex(author => author.id === id);
      if (idx !== -1 && data) authors.value[idx] = data;
      if (currentAuthor.value && currentAuthor.value.id === id && data) currentAuthor.value = data;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update author';
      return null;
    } finally {
      loading.value = false;
    }
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
