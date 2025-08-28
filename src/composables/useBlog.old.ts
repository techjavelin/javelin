import { ref, computed, onMounted } from 'vue'
import type { AuthMode } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'

const client = generateClient<Schema>()

// Types
type BlogPost = Schema['BlogPost']['type']
type Author = Schema['Author']['type']
type Tag = Schema['Tag']['type']
type PostTag = Schema['PostTag']['type']

interface ListOptions {
  limit?: number
  nextToken?: string
  authMode?: AuthMode
  authToken?: string
}

interface CreatePostOptions {
  title: string
  slug: string
  content: string
  authorId?: string
  status?: 'DRAFT' | 'PUBLISHED'
  featuredPost?: boolean
}

interface CreateAuthorOptions {
  name: string
  email: string
  bio?: string
  avatarUrl?: string
}

interface CreateTagOptions {
  name: string
  slug: string
  description?: string
  color?: string
}

// Blog Posts Composable
export function useBlog() {
  // Reactive state
  const posts = ref<BlogPost[]>([])
  const currentPost = ref<BlogPost | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Fetch all posts
  const fetchPosts = async (options: ListOptions = {}) => {
    try {
      loading.value = true
      error.value = null
      const result = await client.models.BlogPost.list({
        limit: options.limit,
        nextToken: options.nextToken
      })
      if (result.data) {
        posts.value = result.data
      }
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Failed to fetch posts'
      }
    } finally {
      loading.value = false
    }
  }

  // Fetch single post by ID
  const fetchPostById = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      const result = await client.models.BlogPost.get({ id })
      if (result.data) {
        currentPost.value = result.data
      }
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Failed to fetch post'
      }
    } finally {
      loading.value = false
    }
  }

      const nextToken = ref<string | null>(null)
      const loading = ref<boolean>(false)
      const error = ref<string | null>(null)
    try {
      loading.value = true
      error.value = null
      const result = await client.models.BlogPost.create({
        title: postData.title,
        slug: postData.slug,
        content: postData.content,
        authorId: postData.authorId,
            nextToken: options.nextToken || nextToken.value || undefined
        featuredPost: postData.featuredPost || false,
        publishedAt: postData.status === 'PUBLISHED' ? new Date().toISOString() : null,
        metaTitle: postData.title,
        metaDescription: postData.content.substring(0, 160),
        readTime: Math.ceil(postData.content.split(' ').length / 200),
        viewCount: 0,
        likeCount: 0,
            nextToken.value = result.nextToken || null
        commentCount: 0
      })
      if (result.data) {
        posts.value = [...posts.value, result.data]
        return result.data
      }
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Failed to create post'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update post
  const updatePost = async (id: string, updates: Partial<CreatePostOptions>) => {
    try {
      loading.value = true
      error.value = null
      const result = await client.models.BlogPost.update({
        id,
        ...updates,
        updatedAt: new Date().toISOString()
      })
      if (result.data) {
        const index = posts.value.findIndex((post: BlogPost) => post.id === id)
        if (index !== -1) {
          posts.value[index] = result.data
        }
      const createPost = async (postData: CreatePostOptions) => {
          currentPost.value = result.data
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Failed to update post'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete post
  const deletePost = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      await client.models.BlogPost.delete({ id })
      posts.value = posts.value.filter((post: BlogPost) => post.id !== id)
      if (currentPost.value && currentPost.value.id === id) {
        currentPost.value = null
      }
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Failed to delete post'
      }
      throw err
    } finally {
      loading.value = false
    }
      const updatePost = async (id: string, updates: Partial<CreatePostOptions>) => {

  // Computed properties
  const publishedPosts = computed(() =>
    posts.value.filter((post: BlogPost) => post.status === 'PUBLISHED')
  )

  const featuredPosts = computed(() =>
    posts.value.filter((post: BlogPost) => post.featuredPost && post.status === 'PUBLISHED')
  )

  const draftPosts = computed(() =>
    posts.value.filter((post: BlogPost) => post.status === 'DRAFT')
  )

  return {
    // State
    posts,
    currentPost,
    loading,
    error,
    // Actions
    fetchPosts,
    fetchPostById,
    createPost,
    updatePost,
    deletePost,
    // Computed
    publishedPosts,
    featuredPosts,
    draftPosts
      const deletePost = async (id: string) => {
}

// Authors Composable
export function useAuthors() {
  const authors = ref<Author[]>([])
  const currentAuthor = ref<Author | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Fetch all authors
  const fetchAuthors = async () => {
    try {
      loading.value = true
      error.value = null
      const result = await client.models.Author.list()
      if (result.data) {
        authors.value = result.data
      }
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Failed to fetch authors'
      }
    } finally {
      loading.value = false
    }
  }

  // Fetch author by ID
  const fetchAuthorById = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      const result = await client.models.Author.get({ id })
      if (result.data) {
        currentAuthor.value = result.data
      }
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Failed to fetch author'
      }
    } finally {
      loading.value = false
    }
  }

  // Create author
  const createAuthor = async (authorData: CreateAuthorOptions) => {
    try {
      loading.value = true
      error.value = null
      const result = await client.models.Author.create(authorData)
      if (result.data) {
        authors.value = [...authors.value, result.data]
        return result.data
      }
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Failed to create author'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update author
  const updateAuthor = async (id: string, updates: Partial<CreateAuthorOptions>) => {
    try {
      loading.value = true
      error.value = null
      const result = await client.models.Author.update({ id, ...updates })
      if (result.data) {
        const index = authors.value.findIndex((author: Author) => author.id === id)
        if (index !== -1) {
          authors.value[index] = result.data
        }
        
        // Update current author if it's the same one
        if (currentAuthor.value && currentAuthor.value.id === id) {
          currentAuthor.value = result.data
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Failed to update author'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    authors,
    currentAuthor,
    loading,
    error,
    fetchAuthors,
    fetchAuthorById,
    createAuthor,
    updateAuthor
  }
}

// Tags Composable
export function useTags() {
  const tags = ref<Tag[]>([])
  const postTags = ref<PostTag[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Fetch all tags
  const fetchTags = async () => {
    try {
      loading.value = true
      error.value = null
      const result = await client.models.Tag.list()
      if (result.data) {
        tags.value = result.data
      }
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Failed to fetch tags'
      }
    } finally {
      loading.value = false
    }
  }

  // Fetch tags for a specific post
  const fetchPostTags = async (postId: string) => {
    try {
      loading.value = true
      error.value = null
      const result = await client.models.PostTag.list()
      if (result.data) {
        postTags.value = result.data.filter(pt => pt.postId === postId)
      }
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Failed to fetch post tags'
      }
    } finally {
      loading.value = false
    }
  }

  // Create tag
  const createTag = async (tagData: CreateTagOptions) => {
    try {
      loading.value = true
      error.value = null
      const result = await client.models.Tag.create(tagData)
      if (result.data) {
        tags.value = [...tags.value, result.data]
        return result.data
      }
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Failed to create tag'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    tags,
    postTags,
    loading,
    error,
    fetchTags,
    fetchPostTags,
    createTag
  }
}

// Blog state management composable
export function useBlogState() {
  const { posts, loading, error, fetchPosts } = useBlog()

  // Initialize blog data
// ...existing code...
const fetchPostById = async (id: string) => {
  loading.value = true
  error.value = null
    
    try {
      const result = await client.models.Post.get({ id })
      currentPost.value = result.data
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch post'
      error.value = errorMessage
      console.error('Error fetching post:', err)
    } finally {
      loading.value = false
    }
  }
  
  // Fetch post by slug
  const fetchPostBySlug = async (slug: string) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await client.models.Post.listPostBySlug({ slug })
      const post = result.data[0] || null
      currentPost.value = post
      
      if (!post) {
        error.value = 'Post not found'
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch post'
      error.value = errorMessage
      console.error('Error fetching post by slug:', err)
    } finally {
      loading.value = false
    }
  }
  
  // Create new post
  const createPost = async (postData: Partial<Post>) => {
    loading.value = true
    error.value = null
    
    try {
    export { useBlog as useBlogPosts }
        title: postData.title || '',
        slug: postData.slug || '',
    export default useBlog
        excerpt: postData.excerpt,
        featuredImage: postData.featuredImage,
        featuredPost: postData.featuredPost || false,
        status: postData.status || 'DRAFT',
        publishedAt: postData.publishedAt,
        metaDescription: postData.metaDescription,
        metaKeywords: postData.metaKeywords,
        readingTime: postData.readingTime || 0,
        viewCount: postData.viewCount || 0,
        categoryId: postData.categoryId,
        authorId: postData.authorId || ''
      })
      
      if (result.data) {
        posts.value = [result.data, ...posts.value]
      }
      
      return result.data
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post'
      error.value = errorMessage
      console.error('Error creating post:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Update existing post
  const updatePost = async (id: string, updates: Partial<Post>) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await client.models.Post.update({
        id,
        ...updates
      })
      
      // Update in local state
      const index = posts.value.findIndex(post => post.id === id)
      if (index !== -1 && result.data) {
        posts.value[index] = result.data
      }
      
      if (currentPost.value && currentPost.value.id === id && result.data) {
        currentPost.value = result.data
      }
      
      return result.data
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update post'
      error.value = errorMessage
      console.error('Error updating post:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Delete post
  const deletePost = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      await client.models.Post.delete({ id })
      
      // Remove from local state
      posts.value = posts.value.filter(post => post.id !== id)
      
      // Clear current post if it's the deleted one
      if (currentPost.value && currentPost.value.id === id) {
        currentPost.value = null
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete post'
      error.value = errorMessage
      console.error('Error deleting post:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Computed properties
  const publishedPosts = computed(() => 
    posts.value.filter(post => post.status === 'PUBLISHED')
  )
  
  const featuredPosts = computed(() => 
    posts.value.filter(post => post.featuredPost && post.status === 'PUBLISHED')
  )
  
  const draftPosts = computed(() => 
    posts.value.filter(post => post.status === 'DRAFT')
  )
  
  return {
    // State
    posts,
    currentPost,
    loading,
    error,
    nextToken,
    
    // Actions
    fetchPosts,
    fetchPostById,
    fetchPostBySlug,
    createPost,
    updatePost,
    deletePost,
    
    // Computed
    publishedPosts,
    featuredPosts,
    draftPosts
  }
}

// Authors Composable
export function useAuthors() {
  const authors = ref<Author[]>([])
  const currentAuthor = ref<Author | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchAuthors = async () => {
    loading.value = true
    error.value = null
    
    try {
      const result = await client.models.Author.list()
      authors.value = result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch authors'
      error.value = errorMessage
      console.error('Error fetching authors:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchAuthorById = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await client.models.Author.get({ id })
      currentAuthor.value = result.data
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch author'
      error.value = errorMessage
      console.error('Error fetching author:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const createAuthor = async (authorData: Partial<Author>) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await client.models.Author.create(authorData)
      if (result.data) {
        authors.value = [...authors.value, result.data]
      }
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create author'
      error.value = errorMessage
      console.error('Error creating author:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateAuthor = async (id: string, updates: Partial<Author>) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await client.models.Author.update({
        id,
        ...updates
      })
      
      // Update in authors list
      const index = authors.value.findIndex(author => author.id === id)
      if (index !== -1 && result.data) {
        authors.value[index] = result.data
      }
      
      // Update current author if it's the one being edited
      if (currentAuthor.value && currentAuthor.value.id === id && result.data) {
        currentAuthor.value = result.data
      }
      
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update author'
      error.value = errorMessage
      console.error('Error updating author:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    authors,
    currentAuthor,
    loading,
    error,
    fetchAuthors,
    fetchAuthorById,
    createAuthor,
    updateAuthor
  }
}

// Tags Composable
export function useTags() {
  const tags = ref<Tag[]>([])
  const postTags = ref<PostTag[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTags = async () => {
    loading.value = true
    error.value = null
    
    try {
      const result = await client.models.Tag.list()
      tags.value = result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tags'
      error.value = errorMessage
      console.error('Error fetching tags:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchPostTags = async (postId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await client.models.PostTag.listPostTagByPost({ postId })
      postTags.value = result.data
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch post tags'
      error.value = errorMessage
      console.error('Error fetching post tags:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  const createTag = async (tagData: Partial<Tag>) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await client.models.Tag.create(tagData)
      if (result.data) {
        tags.value = [...tags.value, result.data]
      }
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tag'
      error.value = errorMessage
      console.error('Error creating tag:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const addTagToPost = async (postId: string, tagId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await client.models.PostTag.create({
        postId,
        tagId
      })
      
      if (result.data) {
        postTags.value = [...postTags.value, result.data]
      }
      
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add tag to post'
      error.value = errorMessage
      console.error('Error adding tag to post:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeTagFromPost = async (postId: string, tagId: string) => {
    loading.value = true
    error.value = null
    
    try {
      // Find the PostTag record
      const postTag = postTags.value.find(pt => pt.postId === postId && pt.tagId === tagId)
      if (postTag) {
        await client.models.PostTag.delete({ id: postTag.id })
        postTags.value = postTags.value.filter(pt => pt.id !== postTag.id)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove tag from post'
      error.value = errorMessage
      console.error('Error removing tag from post:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    tags,
    postTags,
    loading,
    error,
    fetchTags,
    fetchPostTags,
    createTag,
    addTagToPost,
    removeTagFromPost
  }
}

// Export the main useBlogPosts as useBlog for backward compatibility
export { useBlogPosts as useBlog }

// Default export
export default useBlogPosts

// Authors Composable
export function useAuthors() {
  const authors = ref([])
  const currentAuthor = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchAuthors = async () => {
    loading.value = true
    error.value = null
    
    try {
      const result = await authorService.list()
      authors.value = result.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch authors'
      console.error('Error fetching authors:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchAuthorById = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await authorService.getById(id)
      currentAuthor.value = result.data
      return result.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch author'
      console.error('Error fetching author:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const createAuthor = async (authorData) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await authorService.create(authorData)
      authors.value = [...authors.value, result.data]
      return result.data
    } catch (err) {
      error.value = err.message || 'Failed to create author'
      console.error('Error creating author:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateAuthor = async (id, updates) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await authorService.update(id, updates)
      
      // Update in authors list
      const index = authors.value.findIndex(author => author.id === id)
      if (index !== -1) {
        authors.value[index] = { ...authors.value[index], ...updates }
      }
      
      // Update current author if it's the one being edited
      if (currentAuthor.value && currentAuthor.value.id === id) {
        currentAuthor.value = { ...currentAuthor.value, ...updates }
      }
      
      return result.data
    } catch (err) {
      error.value = err.message || 'Failed to update author'
      console.error('Error updating author:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    authors,
    currentAuthor,
    loading,
    error,
    fetchAuthors,
    fetchAuthorById,
    createAuthor,
    updateAuthor
  }
}

// Tags Composable
export function useTags() {
  const tags = ref([])
  const postTags = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchTags = async () => {
    loading.value = true
    error.value = null
    
    try {
      const result = await tagService.list()
      tags.value = result.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch tags'
      console.error('Error fetching tags:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchPostTags = async (postId) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await tagService.getByPost(postId)
      postTags.value = result.data
      return result.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch post tags'
      console.error('Error fetching post tags:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  const createTag = async (tagData) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await tagService.create(tagData)
      tags.value = [...tags.value, result.data]
      return result.data
    } catch (err) {
      error.value = err.message || 'Failed to create tag'
      console.error('Error creating tag:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const addTagToPost = async (postId, tagId) => {
    try {
      const result = await tagService.addToPost(postId, tagId)
      return result.data
    } catch (err) {
      error.value = err.message || 'Failed to add tag to post'
      console.error('Error adding tag to post:', err)
      throw err
    }
  }

  const removeTagFromPost = async (postTagId) => {
    try {
      await tagService.removeFromPost(postTagId)
      postTags.value = postTags.value.filter(pt => pt.id !== postTagId)
    } catch (err) {
      error.value = err.message || 'Failed to remove tag from post'
      console.error('Error removing tag from post:', err)
      throw err
    }
  }

  return {
    tags,
    postTags,
    loading,
    error,
    fetchTags,
    fetchPostTags,
    createTag,
    addTagToPost,
    removeTagFromPost
  }
}

// Comments Composable
export function useComments() {
  const comments = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchComments = async (postId, approvedOnly = true) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await commentService.getByPost(postId, approvedOnly)
      comments.value = result.data
      return result.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch comments'
      console.error('Error fetching comments:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  const createComment = async (commentData) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await commentService.create(commentData)
      
      // Log analytics event
      await analyticsService.logEvent(commentData.postId, 'COMMENT')
      
      return result.data
    } catch (err) {
      error.value = err.message || 'Failed to create comment'
      console.error('Error creating comment:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const approveComment = async (commentId) => {
    try {
      await commentService.approve(commentId)
      
      // Update comment in local state
      const comment = comments.value.find(c => c.id === commentId)
      if (comment) {
        comment.isApproved = true
      }
    } catch (err) {
      error.value = err.message || 'Failed to approve comment'
      console.error('Error approving comment:', err)
      throw err
    }
  }

  const markSpam = async (commentId) => {
    try {
      await commentService.markSpam(commentId)
      
      // Remove comment from local state
      comments.value = comments.value.filter(c => c.id !== commentId)
    } catch (err) {
      error.value = err.message || 'Failed to mark comment as spam'
      console.error('Error marking comment as spam:', err)
      throw err
    }
  }

  // Organize comments into threaded structure
  const threadedComments = computed(() => {
    const threaded = []
    const commentMap = new Map()
    
    // First pass: create map of all comments
    comments.value.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })
    
    // Second pass: organize into threads
    commentMap.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId)
        if (parent) {
          parent.replies.push(comment)
        }
      } else {
        threaded.push(comment)
      }
    })
    
    return threaded
  })

  return {
    comments,
    loading,
    error,
    threadedComments,
    fetchComments,
    createComment,
    approveComment,
    markSpam
  }
}

// Newsletter Composable
export function useNewsletter() {
  const subscribers = ref([])
  const loading = ref(false)
  const error = ref(null)
  const successMessage = ref('')

  const subscribe = async (email, name, preferences) => {
    loading.value = true
    error.value = null
    successMessage.value = ''
    
    try {
      await newsletterService.subscribe(email, name, preferences)
      successMessage.value = 'Successfully subscribed to newsletter!'
      return true
    } catch (err) {
      error.value = err.message || 'Failed to subscribe to newsletter'
      console.error('Error subscribing to newsletter:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const unsubscribe = async (email) => {
    loading.value = true
    error.value = null
    successMessage.value = ''
    
    try {
      await newsletterService.unsubscribe(email)
      successMessage.value = 'Successfully unsubscribed from newsletter!'
      return true
    } catch (err) {
      error.value = err.message || 'Failed to unsubscribe from newsletter'
      console.error('Error unsubscribing from newsletter:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const fetchSubscribers = async () => {
    loading.value = true
    error.value = null
    
    try {
      const result = await newsletterService.getSubscribers()
      subscribers.value = result.data
      return result.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch subscribers'
      console.error('Error fetching subscribers:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    subscribers,
    loading,
    error,
    successMessage,
    subscribe,
    unsubscribe,
    fetchSubscribers
  }
}

// Analytics Composable
export function useAnalytics() {
  const analytics = ref([])
  const loading = ref(false)
  const error = ref(null)

  const logEvent = async (postId, event, metadata) => {
    try {
      await analyticsService.logEvent(postId, event, metadata)
    } catch (err) {
      // Analytics failures shouldn't break user experience
      console.error('Analytics error:', err)
    }
  }

  const fetchPostAnalytics = async (postId, startDate, endDate) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await analyticsService.getPostAnalytics(postId, startDate, endDate)
      analytics.value = result.data
      return result.data
    } catch (err) {
      error.value = err.message || 'Failed to fetch analytics'
      console.error('Error fetching analytics:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  const getAnalyticsSummary = (analyticsData) => {
    const summary = {
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0
    }
    
    analyticsData.forEach(event => {
      switch (event.event) {
        case 'VIEW':
          summary.views++
          break
        case 'LIKE':
          summary.likes++
          break
        case 'SHARE':
          summary.shares++
          break
        case 'COMMENT':
          summary.comments++
          break
      }
    })
    
    return summary
  }

  return {
    analytics,
    loading,
    error,
    logEvent,
    fetchPostAnalytics,
    getAnalyticsSummary
  }
}

// Blog utilities composable
export function useBlogUtils() {
  return {
    generateSlug: blogUtils.generateSlug,
    calculateReadTime: blogUtils.calculateReadTime,
    extractExcerpt: blogUtils.extractExcerpt,
    validatePost: blogUtils.validatePost
  }
}
