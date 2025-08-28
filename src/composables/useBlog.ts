import { ref } from 'vue';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

type BlogPost = Schema['BlogPost']['type'];

export function useBlog() {
	const blogPosts = ref<BlogPost[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	async function fetchBlogPosts() {
		loading.value = true;
		error.value = null;
		try {
			const { data, errors } = await client.models.BlogPost.list();
					if (errors) {
						error.value = errors.map((e: { message: string }) => e.message).join(', ');
						blogPosts.value = [];
					} else {
						blogPosts.value = data as BlogPost[];
					}
		} catch (e: any) {
			error.value = e.message || 'Unknown error';
			blogPosts.value = [];
		} finally {
			loading.value = false;
		}
	}

	async function createBlogPost(input: Omit<BlogPost, 'id'>) {
		loading.value = true;
		error.value = null;
		try {
			const { data, errors } = await client.models.BlogPost.create(input);
					if (errors) {
						error.value = errors.map((e: { message: string }) => e.message).join(', ');
						return null;
					}
			await fetchBlogPosts();
			return data as BlogPost;
		} catch (e: any) {
			error.value = e.message || 'Unknown error';
			return null;
		} finally {
			loading.value = false;
		}
	}

	async function updateBlogPost(id: string, input: Partial<BlogPost>) {
		loading.value = true;
		error.value = null;
		try {
			const { data, errors } = await client.models.BlogPost.update({ id, ...input });
					if (errors) {
						error.value = errors.map((e: { message: string }) => e.message).join(', ');
						return null;
					}
			await fetchBlogPosts();
			return data as BlogPost;
		} catch (e: any) {
			error.value = e.message || 'Unknown error';
			return null;
		} finally {
			loading.value = false;
		}
	}

	async function deleteBlogPost(id: string) {
		loading.value = true;
		error.value = null;
		try {
			const { data, errors } = await client.models.BlogPost.delete({ id });
					if (errors) {
						error.value = errors.map((e: { message: string }) => e.message).join(', ');
						return false;
					}
			await fetchBlogPosts();
			return true;
		} catch (e: any) {
			error.value = e.message || 'Unknown error';
			return false;
		} finally {
			loading.value = false;
		}
	}

	async function fetchBlogPostById(id: string) {
		loading.value = true;
		error.value = null;
		try {
			const { data, errors } = await client.models.BlogPost.get({ id });
					if (errors) {
						error.value = errors.map((e: { message: string }) => e.message).join(', ');
						return null;
					}
			return data as BlogPost;
		} catch (e: any) {
			error.value = e.message || 'Unknown error';
			return null;
		} finally {
			loading.value = false;
		}
	}

	return {
		blogPosts,
		loading,
		error,
		fetchBlogPosts,
		fetchBlogPostById,
		createBlogPost,
		updateBlogPost,
		deleteBlogPost,
	};
}
