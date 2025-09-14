import { ref, computed } from 'vue';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

type BlogPost = Schema['BlogPost']['type'];


export function useBlog() {
  // Fetch a blog post by slug
  const fetchPostBySlug = async (slug: string) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await client.models.BlogPost.list({
        filter: { slug: { eq: slug } },
        limit: 1
      });
      currentPost.value = data && data.length > 0 ? data[0] : null;
      if (!currentPost.value) {
        error.value = 'Blog post not found.';
      }
      return currentPost.value;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch post by slug';
      return null;
    } finally {
      loading.value = false;
    }
  };
  const client = generateClient<Schema>();
  const posts = ref<BlogPost[]>([]);
  const currentPost = ref<BlogPost | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchPosts = async () => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await client.models.BlogPost.list();
      posts.value = data || [];
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch posts';
    } finally {
      loading.value = false;
    }
  };

  const fetchPostById = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await client.models.BlogPost.get({ id });
      currentPost.value = data || null;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch post';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const createPost = async (input: Partial<BlogPost>) => {
    loading.value = true;
    error.value = null;
    try {
      if (!input.title || !input.slug || !input.content) {
        throw new Error('Missing required fields: title, slug, content');
      }
      const { data } = await client.models.BlogPost.create({
        title: input.title,
        slug: input.slug,
        content: input.content,
        authorId: input.authorId ?? '',
        status: input.status || 'DRAFT',
        featuredPost: input.featuredPost || false,
        summary: input.summary,
        excerpt: input.excerpt,
        publishedAt: input.publishedAt,
        metaDescription: input.metaDescription,
        readTime: input.readTime,
        viewCount: input.viewCount,
        updatedAt: input.updatedAt,
        owner: input.owner,
      });
      if (data) posts.value = [...posts.value, data];
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to create post';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updatePost = async (id: string, updates: Partial<BlogPost>) => {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await client.models.BlogPost.update({ id, ...updates });
      const idx = posts.value.findIndex(post => post.id === id);
      if (idx !== -1 && data) posts.value[idx] = data;
      if (currentPost.value && currentPost.value.id === id && data) currentPost.value = data;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update post';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deletePost = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await client.models.BlogPost.delete({ id });
      posts.value = posts.value.filter(post => post.id !== id);
      if (currentPost.value && currentPost.value.id === id) currentPost.value = null;
      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to delete post';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const publishedPosts = computed(() => posts.value.filter(post => post.status === 'PUBLISHED'));
  const featuredPosts = computed(() => posts.value.filter(post => post.featuredPost && post.status === 'PUBLISHED'));
  const draftPosts = computed(() => posts.value.filter(post => post.status === 'DRAFT'));

  return {
    posts,
    currentPost,
    loading,
    error,
    fetchPosts,
    fetchPostById,
    fetchPostBySlug,
    createPost,
    updatePost,
    deletePost,
    publishedPosts,
    featuredPosts,
    draftPosts,
  };
}
