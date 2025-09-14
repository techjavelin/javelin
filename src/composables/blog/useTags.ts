import { ref } from 'vue';
import type { Schema } from '../../../amplify/data/resource';
import { getClient } from '../../amplifyClient';

type Tag = Schema['Tag']['type'];
type PostTag = Schema['PostTag']['type'];


// Singleton state outside of factory to preserve cache across imports
const _tags = ref<Tag[]>([]);
const _postTags = ref<PostTag[]>([]);
const _loading = ref(false);
const _error = ref<string | null>(null);
// Lazy client accessor to ensure Amplify has been configured
const client = getClient();

export function useTags() {
  const tags = _tags;
  const postTags = _postTags;
  const loading = _loading;
  const error = _error;

  const fetchTags = async (options?: { force?: boolean }) => {
    if (!options?.force && tags.value.length > 0) return; // guard
    loading.value = true;
    error.value = null;
    try {
      const { data } = await client.models.Tag.list();
      tags.value = data || [];
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch tags';
    } finally {
      loading.value = false;
    }
  };

  const fetchPostTags = async (postId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await client.models.PostTag.list();
      const filtered = (data || []).filter(pt => pt.postId === postId);
      postTags.value = filtered;
      return filtered;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch post tags';
      return [];
    } finally {
      loading.value = false;
    }
  };

  const createTag = async (input: Partial<Tag>) => {
    loading.value = true;
    error.value = null;
    try {
      if (!input.name) {
        throw new Error('Missing required field: name');
      }
      const slug = (input.slug || input.name)
        .toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
      const { data } = await client.models.Tag.create({
        name: input.name,
        slug,
        description: input.description,
        color: input.color,
        owner: (input as any).owner,
      });
      if (data) tags.value = [...tags.value, data];
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to create tag';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    loading.value = true;
    error.value = null;
    try {
      if (updates.name) {
        updates.slug = (updates.slug || updates.name)
          ?.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
      }
      const { data } = await client.models.Tag.update({ id, ...updates });
      const idx = tags.value.findIndex(t => t.id === id);
      if (idx !== -1 && data) tags.value[idx] = data;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update tag';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteTag = async (id: string) => {
    loading.value = true;
    error.value = null;
    const prev = [...tags.value];
    try {
      tags.value = tags.value.filter(t => t.id !== id);
      await client.models.Tag.delete({ id });
      return true;
    } catch (err: any) {
      tags.value = prev;
      error.value = err.message || 'Failed to delete tag';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const addTagToPost = async (postId: string, tagId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await client.models.PostTag.create({ postId, tagId });
      if (data) postTags.value = [...postTags.value, data];
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to add tag to post';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const removeTagFromPost = async (postId: string, tagId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const postTag = postTags.value.find(pt => pt.postId === postId && pt.tagId === tagId);
      if (postTag) {
        await client.models.PostTag.delete({ id: postTag.id });
        postTags.value = postTags.value.filter(pt => pt.id !== postTag.id);
      }
      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to remove tag from post';
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    tags,
    postTags,
    loading,
    error,
    fetchTags,
    fetchPostTags,
    createTag,
    updateTag,
    deleteTag,
    addTagToPost,
    removeTagFromPost,
  };
}
