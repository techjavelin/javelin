import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'

const client = generateClient<Schema>()

export interface BlogPostData {
  title: string
  slug: string
  summary?: string
  content: string
  excerpt?: string
  metaDescription?: string
  previewImageUrl?: string
  previewImageAlt?: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt?: string
  featuredPost?: boolean
  readTime?: number
  authorId: string
  seoTitle?: string
  seoKeywords?: string
  tableOfContents?: any
  viewCount?: number // Add to BlogPostData type/interface
}

export interface AuthorData {
  name: string
  email: string
  bio?: string
  avatarUrl?: string
  website?: string
  twitterHandle?: string
  linkedinProfile?: string
  githubProfile?: string
}

export interface TagData {
  name: string
  slug: string
  description?: string
  color?: string
}

export interface CategoryData {
  name: string
  slug: string
  description?: string
  color?: string
  parentId?: string
}

export interface CommentData {
  content: string
  authorName: string
  authorEmail: string
  authorWebsite?: string
  postId: string
  parentId?: string
}

// Blog Post Services
export const blogPostService = {
  // Create a new blog post
  async create(postData: BlogPostData) {
    const client = generateClient<Schema>()
    try {
      const result = await client.models.BlogPost.create({
        ...postData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 0,
        featuredPost: postData.featuredPost || false
      })
      return result
    } catch (error) {
      console.error('Error creating blog post:', error)
      throw error
    }
  },

  // Get all blog posts with optional filters
  async list(options: {
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    featured?: boolean
    authorId?: string
    limit?: number
    nextToken?: string
  } = {}) {
    const client = generateClient<Schema>()
    try {
      const filter: any = {}
      
      if (options.status) {
        filter.status = { eq: options.status }
      }
      
      if (options.featured !== undefined) {
        filter.featuredPost = { eq: options.featured }
      }
      
      if (options.authorId) {
        filter.authorId = { eq: options.authorId }
      }

      const result = await client.models.BlogPost.list({
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        limit: options.limit || 20,
        nextToken: options.nextToken
      })
      
      return result
    } catch (error) {
      console.error('Error listing blog posts:', error)
      throw error
    }
  },

  // Get a single blog post by ID
  async getById(id: string) {
    const client = generateClient<Schema>()
    try {
      const result = await client.models.BlogPost.get({ id })
      return result
    } catch (error) {
      console.error('Error getting blog post:', error)
      throw error
    }
  },

  // Get a single blog post by slug
  async getBySlug(slug: string) {
    const client = generateClient<Schema>()
    try {
      const result = await client.models.BlogPost.list({
        filter: { slug: { eq: slug } },
        limit: 1
      })
      return result.data[0] || null
    } catch (error) {
      console.error('Error getting blog post by slug:', error)
      throw error
    }
  },

  // Update a blog post
  async update(id: string, updates: Partial<BlogPostData>) {
    const client = generateClient<Schema>()
    try {
      const result = await client.models.BlogPost.update({
        id,
        ...updates,
        updatedAt: new Date().toISOString()
      })
      return result
    } catch (error) {
      console.error('Error updating blog post:', error)
      throw error
    }
  },

  // Delete a blog post
  async delete(id: string) {
    const client = generateClient<Schema>()
    try {
      const result = await client.models.BlogPost.delete({ id })
      return result
    } catch (error) {
      console.error('Error deleting blog post:', error)
      throw error
    }
  },

  // Increment view count
  async incrementView(id: string) {
    const client = generateClient<Schema>()
    try {
      // First get the current post
      const post = await this.getById(id)
      if (post.data) {
        const currentViews = post.data.viewCount || 0
        await this.update(id, { viewCount: currentViews + 1 })
        
        // Also log analytics
        await analyticsService.logEvent(id, 'VIEW')
      }
    } catch (error) {
      console.error('Error incrementing view count:', error)
    }
  }
}

// Author Services
export const authorService = {
  async create(authorData: AuthorData) {
    try {
      const result = await client.models.Author.create({
        ...authorData,
        isActive: true,
        joinedAt: new Date().toISOString()
      })
      return result
    } catch (error) {
      console.error('Error creating author:', error)
      throw error
    }
  },

  async list() {
    try {
      const result = await client.models.Author.list({
        filter: { isActive: { eq: true } }
      })
      return result
    } catch (error) {
      console.error('Error listing authors:', error)
      throw error
    }
  },

  async getById(id: string) {
    try {
      const result = await client.models.Author.get({ id })
      return result
    } catch (error) {
      console.error('Error getting author:', error)
      throw error
    }
  },

  async update(id: string, updates: Partial<AuthorData>) {
    try {
      const result = await client.models.Author.update({ id, ...updates })
      return result
    } catch (error) {
      console.error('Error updating author:', error)
      throw error
    }
  }
}

// Tag Services
export const tagService = {
  async create(tagData: TagData) {
    try {
      const result = await client.models.Tag.create(tagData)
      return result
    } catch (error) {
      console.error('Error creating tag:', error)
      throw error
    }
  },

  async list() {
    try {
      const result = await client.models.Tag.list()
      return result
    } catch (error) {
      console.error('Error listing tags:', error)
      throw error
    }
  },

  async getById(id: string) {
    try {
      const result = await client.models.Tag.get({ id })
      return result
    } catch (error) {
      console.error('Error getting tag:', error)
      throw error
    }
  },

  // Associate a tag with a post
  async addToPost(postId: string, tagId: string) {
    try {
      const result = await client.models.PostTag.create({ postId, tagId })
      return result
    } catch (error) {
      console.error('Error adding tag to post:', error)
      throw error
    }
  },

  // Remove tag from post
  async removeFromPost(postTagId: string) {
    try {
      const result = await client.models.PostTag.delete({ id: postTagId })
      return result
    } catch (error) {
      console.error('Error removing tag from post:', error)
      throw error
    }
  },

  // Get tags for a specific post
  async getByPost(postId: string) {
    try {
      const result = await client.models.PostTag.list({
        filter: { postId: { eq: postId } }
      })
      return result
    } catch (error) {
      console.error('Error getting tags for post:', error)
      throw error
    }
  }
}

// Category Services
export const categoryService = {
  async create(categoryData: CategoryData) {
    try {
      const result = await client.models.Category.create(categoryData)
      return result
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  },

  async list() {
    try {
      const result = await client.models.Category.list()
      return result
    } catch (error) {
      console.error('Error listing categories:', error)
      throw error
    }
  },

  async getById(id: string) {
    try {
      const result = await client.models.Category.get({ id })
      return result
    } catch (error) {
      console.error('Error getting category:', error)
      throw error
    }
  },

  // Associate a category with a post
  async addToPost(postId: string, categoryId: string) {
    try {
      const result = await client.models.PostCategory.create({ postId, categoryId })
      return result
    } catch (error) {
      console.error('Error adding category to post:', error)
      throw error
    }
  },

  // Get categories for a specific post
  async getByPost(postId: string) {
    try {
      const result = await client.models.PostCategory.list({
        filter: { postId: { eq: postId } }
      })
      return result
    } catch (error) {
      console.error('Error getting categories for post:', error)
      throw error
    }
  }
}

// Comment Services
export const commentService = {
  async create(commentData: CommentData) {
    try {
      const result = await client.models.Comment.create({
        ...commentData,
        isApproved: false, // Comments need approval by default
        isSpam: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      return result
    } catch (error) {
      console.error('Error creating comment:', error)
      throw error
    }
  },

  async getByPost(postId: string, approvedOnly: boolean = true) {
    try {
      const filter: any = { postId: { eq: postId } }
      
      if (approvedOnly) {
        filter.isApproved = { eq: true }
        filter.isSpam = { eq: false }
      }

      const result = await client.models.Comment.list({ filter })
      return result
    } catch (error) {
      console.error('Error getting comments for post:', error)
      throw error
    }
  },

  async approve(id: string) {
    try {
      const result = await client.models.Comment.update({
        id,
        isApproved: true,
        updatedAt: new Date().toISOString()
      })
      return result
    } catch (error) {
      console.error('Error approving comment:', error)
      throw error
    }
  },

  async markSpam(id: string) {
    try {
      const result = await client.models.Comment.update({
        id,
        isSpam: true,
        isApproved: false,
        updatedAt: new Date().toISOString()
      })
      return result
    } catch (error) {
      console.error('Error marking comment as spam:', error)
      throw error
    }
  }
}

// Newsletter Services
export const newsletterService = {
  async subscribe(email: string, name?: string, preferences?: { frequency?: 'WEEKLY' | 'MONTHLY', topics?: string[] }) {
    try {
      const result = await client.models.Newsletter.create({
        email,
        name,
        isSubscribed: true,
        subscribedAt: new Date().toISOString(),
        frequency: preferences?.frequency || 'WEEKLY',
        topics: preferences?.topics || []
      })
      return result
    } catch (error) {
      console.error('Error subscribing to newsletter:', error)
      throw error
    }
  },

  async unsubscribe(email: string) {
    try {
      // Find the subscription
      const subscriptions = await client.models.Newsletter.list({
        filter: { email: { eq: email } }
      })
      
      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0]
        const result = await client.models.Newsletter.update({
          id: subscription.id,
          isSubscribed: false,
          unsubscribedAt: new Date().toISOString()
        })
        return result
      }
      
      throw new Error('Subscription not found')
    } catch (error) {
      console.error('Error unsubscribing from newsletter:', error)
      throw error
    }
  },

  async getSubscribers() {
    try {
      const result = await client.models.Newsletter.list({
        filter: { isSubscribed: { eq: true } }
      })
      return result
    } catch (error) {
      console.error('Error getting newsletter subscribers:', error)
      throw error
    }
  }
}

// Analytics Services
export const analyticsService = {
  async logEvent(postId: string, event: 'VIEW' | 'LIKE' | 'SHARE' | 'COMMENT', metadata?: any) {
    try {
      const result = await client.models.BlogAnalytics.create({
        postId,
        event,
        userAgent: navigator?.userAgent || 'Unknown',
        ipAddress: 'client-side', // IP will be determined server-side
        referrer: document?.referrer || undefined,
        timestamp: new Date().toISOString()
      })
      return result
    } catch (error) {
      console.error('Error logging analytics event:', error)
      // Don't throw - analytics failures shouldn't break the user experience
    }
  },

  async getPostAnalytics(postId: string, startDate?: string, endDate?: string) {
    try {
      const filter: any = { postId: { eq: postId } }
      
      if (startDate) {
        filter.timestamp = { ...filter.timestamp, gte: startDate }
      }
      
      if (endDate) {
        filter.timestamp = { ...filter.timestamp, lte: endDate }
      }

      const result = await client.models.BlogAnalytics.list({ filter })
      return result
    } catch (error) {
      console.error('Error getting post analytics:', error)
      throw error
    }
  }
}

// Utility functions for blog management
export const blogUtils = {
  // Generate a URL-friendly slug from a title
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim()
  },

  // Calculate estimated reading time based on content
  calculateReadTime(content: string, wordsPerMinute: number = 200): number {
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  },

  // Extract excerpt from content
  extractExcerpt(content: string, maxLength: number = 160): string {
    // Strip HTML tags
    const textContent = content.replace(/<[^>]*>/g, '')
    
    if (textContent.length <= maxLength) {
      return textContent
    }
    
    // Find the last complete sentence within the limit
    const excerpt = textContent.substring(0, maxLength)
    const lastSentence = excerpt.lastIndexOf('.')
    
    if (lastSentence > 0) {
      return excerpt.substring(0, lastSentence + 1)
    }
    
    // If no sentence end found, cut at word boundary
    const lastSpace = excerpt.lastIndexOf(' ')
    return lastSpace > 0 ? excerpt.substring(0, lastSpace) + '...' : excerpt + '...'
  },

  // Validate blog post data
  validatePost(postData: BlogPostData): string[] {
    const errors: string[] = []
    
    if (!postData.title?.trim()) {
      errors.push('Title is required')
    }
    
    if (!postData.content?.trim()) {
      errors.push('Content is required')
    }
    
    if (!postData.slug?.trim()) {
      errors.push('Slug is required')
    }
    
    if (!postData.authorId?.trim()) {
      errors.push('Author is required')
    }
    
    // Validate slug format
    if (postData.slug && !/^[a-z0-9-]+$/.test(postData.slug)) {
      errors.push('Slug can only contain lowercase letters, numbers, and hyphens')
    }
    
    return errors
  }
}

export default {
  blogPostService,
  authorService,
  tagService,
  categoryService,
  commentService,
  newsletterService,
  analyticsService,
  blogUtils
}
