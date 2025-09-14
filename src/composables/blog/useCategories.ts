import { ref, computed } from 'vue';
import type { Schema } from '../../../amplify/data/resource';
import { getClient, withUserAuth } from '../../amplifyClient';
import { useApi } from '../useApi';

type Category = Schema['Category']['type'];
type PostCategory = Schema['PostCategory']['type'];

const client = getClient();

// Singleton state so list persists across admin pages
const categories = ref<Category[]>([]);
const _postCategories = ref<PostCategory[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const { withErrorToast } = useApi();

export function useCategories() {
  const rootCategories = computed(() => categories.value.filter(c => !c.parentId));
  const postCategories = _postCategories;
  const byId = (id: string) => categories.value.find(c => c.id === id);

  async function fetchCategories(options?: { force?: boolean }) {
    if (!options?.force && categories.value.length > 0) return;
    loading.value = true; error.value = null;
    try {
  const result = await withErrorToast('Load Categories', () => client.models.Category.list(withUserAuth()));
      categories.value = (result as any).data || [];
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
      const { data } = await withErrorToast('Create Category', async () => client.models.Category.create({
        name: input.name!,
        slug,
        description: input.description,
        color: input.color,
        parentId: input.parentId
      }, withUserAuth()));
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
  const { data } = await withErrorToast('Update Category', () => client.models.Category.update({ id, ...updates }, withUserAuth()));
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
  await withErrorToast('Delete Category', () => client.models.Category.delete({ id }, withUserAuth()));
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
  const { data } = await withErrorToast('Load Post Categories', () => client.models.PostCategory.list(withUserAuth()));
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
