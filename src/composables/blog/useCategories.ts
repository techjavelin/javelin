import { ref, computed } from 'vue';
import type { Schema } from '../../../amplify/data/resource';
import { getClient } from '../../amplifyClient';

type Category = Schema['Category']['type'];
type PostCategory = Schema['PostCategory']['type'];

const client = getClient();

// Singleton state so list persists across admin pages
const categories = ref<Category[]>([]);
const _postCategories = ref<PostCategory[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

export function useCategories() {
  const rootCategories = computed(() => categories.value.filter(c => !c.parentId));
  const postCategories = _postCategories;
  const byId = (id: string) => categories.value.find(c => c.id === id);

  async function fetchCategories(options?: { force?: boolean }) {
    if (!options?.force && categories.value.length > 0) return;
    loading.value = true; error.value = null;
    try {
      const { data } = await client.models.Category.list({
        // Potentially expand for nested retrieval later
      });
      categories.value = data || [];
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch categories';
    } finally { loading.value = false; }
  }

  async function createCategory(input: Partial<Category>) {
    loading.value = true; error.value = null;
    try {
      if (!input.name) throw new Error('Name required');
      const slug = (input.slug || input.name || '')
        .toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
      const { data } = await client.models.Category.create({
        name: input.name!,
        slug,
        description: input.description,
        color: input.color,
        parentId: input.parentId
      });
      if (data) categories.value = [...categories.value, data];
      return data;
    } catch (e: any) {
      error.value = e.message || 'Failed to create category';
      return null;
    } finally { loading.value = false; }
  }

  async function updateCategory(id: string, updates: Partial<Category>) {
    loading.value = true; error.value = null;
    try {
      if (updates.name) {
        updates.slug = (updates.slug || updates.name)
          ?.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
      }
      const { data } = await client.models.Category.update({ id, ...updates });
      const idx = categories.value.findIndex(c => c.id === id);
      if (idx !== -1 && data) categories.value[idx] = data;
      return data;
    } catch (e: any) {
      error.value = e.message || 'Failed to update category';
      return null;
    } finally { loading.value = false; }
  }

  async function deleteCategory(id: string) {
    loading.value = true; error.value = null;
    const prev = [...categories.value];
    try {
      categories.value = categories.value.filter(c => c.id !== id);
      await client.models.Category.delete({ id });
      return true;
    } catch (e: any) {
      categories.value = prev; // rollback
      error.value = e.message || 'Failed to delete category';
      return false;
    } finally { loading.value = false; }
  }

  async function fetchPostCategories(postId: string) {
    loading.value = true; error.value = null;
    try {
      const { data } = await client.models.PostCategory.list();
      const filtered = (data || []).filter(pc => pc.postId === postId);
      postCategories.value = filtered;
      return filtered;
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch post categories';
      return [];
    } finally { loading.value = false; }
  }

  return {
    categories,
    rootCategories,
    postCategories,
    loading,
    error,
    fetchCategories,
    fetchPostCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    byId
  };
}
