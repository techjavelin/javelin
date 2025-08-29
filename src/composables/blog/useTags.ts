import { ref } from 'vue';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

type Tag = Schema['Tag']['type'];
type PostTag = Schema['PostTag']['type'];

export function useTags() {
  const client = generateClient<Schema>();
  const tags = ref<Tag[]>([]);
  const postTags = ref<PostTag[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchTags = async () => {
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
      if (!input.name || !input.slug) {
        throw new Error('Missing required fields: name, slug');
      }
      const { data } = await client.models.Tag.create({
        name: input.name,
        slug: input.slug,
        description: input.description,
        color: input.color,
        owner: input.owner,
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
    addTagToPost,
    removeTagFromPost,
  };
}
