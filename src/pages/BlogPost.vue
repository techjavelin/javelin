<template>
  <PageWrapper>
    <!-- Loading State -->
  <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading blog post...</p>
    </div>

    <!-- Error State -->
  <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Blog Post Not Found</h3>
  <p>{{ error }}</p>
      <router-link to="/blog" class="back-to-blog">← Back to Blog</router-link>
    </div>

    <!-- Blog Post Content -->
  <article v-else-if="post" class="blog-post">
      <!-- Post Header -->
      <header class="post-header">
        <nav class="breadcrumb">
          <router-link to="/blog">Blog</router-link>
          <span class="separator">></span>
          <span v-if="post.categories && post.categories.length > 0">
            {{ post.categories[0].name }}
          </span>
        </nav>

  <h1 class="post-title">{{ post.title }}</h1>
        
        <div class="post-meta">
          <div class="author-info" v-if="post.author">
            <img 
              v-if="post.author.avatarUrl" 
              :src="post.author.avatarUrl" 
              :alt="post.author.name"
              class="author-avatar"
            />
            <div class="author-details">
              <span class="author-name">{{ post.author.name }}</span>
              <div class="post-date-info">
                <time :datetime="post.publishedAt" class="publish-date">
                  {{ formatDate(post.publishedAt) }}
                </time>
                <span v-if="post.readTime" class="read-time">
                  • {{ post.readTime }} min read
                </span>
                <span v-if="post.viewCount" class="view-count">
                  • {{ post.viewCount }} views
                </span>
              </div>
            </div>
          </div>
          
          <div class="post-actions">
            <button @click="sharePost" class="share-btn" title="Share post">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.6 20.92,19A2.92,2.92 0 0,0 18,16.08Z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Featured Image -->
        <div v-if="post.previewImageUrl" class="featured-image">
          <img 
            :src="post.previewImageUrl" 
            :alt="post.previewImageAlt || post.title"
            class="post-image"
          />
        </div>

        <!-- Post Summary -->
        <div v-if="post.summary" class="post-summary">
          {{ post.summary }}
        </div>

        <!-- Tags -->
        <div v-if="post.tags && post.tags.length > 0" class="post-tags">
          <span 
            v-for="tag in post.tags" 
            :key="tag.id"
            class="tag"
            :style="{ '--tag-color': tag.color || '#2566af' }"
          >
            {{ tag.name }}
          </span>
        </div>
      </header>

      <!-- Table of Contents -->
      <aside v-if="post.tableOfContents && post.tableOfContents.length > 0" class="table-of-contents">
        <h3>Table of Contents</h3>
        <ul>
          <li v-for="item in post.tableOfContents" :key="item.id">
            <a :href="`#${item.id}`" :class="`level-${item.level}`">
              {{ item.text }}
            </a>
          </li>
        </ul>
      </aside>

      <!-- Post Content -->
      <div class="post-content" v-html="renderedContent"></div>

      <!-- Post Footer -->
      <footer class="post-footer">
        <!-- Categories -->
        <div v-if="post.categories && post.categories.length > 0" class="post-categories">
          <h4>Categories:</h4>
          <div class="categories-list">
            <router-link 
              v-for="category in post.categories"
              :key="category.id"
              :to="`/blog?category=${category.slug}`"
              class="category-link"
              :style="{ '--category-color': category.color || '#2566af' }"
            >
              {{ category.name }}
            </router-link>
          </div>
        </div>

        <!-- Author Bio -->
        <div v-if="post.author && post.author.bio" class="author-bio">
          <div class="author-card">
            <img 
              v-if="post.author.avatarUrl" 
              :src="post.author.avatarUrl" 
              :alt="post.author.name"
              class="author-avatar-large"
            />
            <div class="author-info">
              <h4>{{ post.author.name }}</h4>
              <p>{{ post.author.bio }}</p>
              <div class="author-links" v-if="hasAuthorLinks">
                <a v-if="post.author.website" :href="post.author.website" target="_blank" rel="noopener" class="author-link">
                  Website
                </a>
                <a v-if="post.author.twitterHandle" :href="`https://twitter.com/${post.author.twitterHandle}`" target="_blank" rel="noopener" class="author-link">
                  Twitter
                </a>
                <a v-if="post.author.linkedinProfile" :href="post.author.linkedinProfile" target="_blank" rel="noopener" class="author-link">
                  LinkedIn
                </a>
                <a v-if="post.author.githubProfile" :href="post.author.githubProfile" target="_blank" rel="noopener" class="author-link">
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="post-navigation">
          <router-link to="/blog" class="back-to-blog">
            ← Back to All Posts
          </router-link>
        </div>
      </footer>
    </article>

    <!-- Related Posts -->
    <section v-if="relatedPosts && relatedPosts.length > 0" class="related-posts">
      <h3>Related Posts</h3>
      <div class="related-posts-grid">
        <BlogCard
          v-for="relatedPost in relatedPosts"
          :key="relatedPost.id"
          :post="relatedPost"
          variant="compact"
          @click="handleRelatedPostClick"
        />
      </div>

    </section>
  </PageWrapper>
</template>

<script setup>

import { ref, computed, watch, onMounted } from 'vue'
import { marked } from 'marked'
import BlogCard from '../components/BlogCard.vue'
import PageWrapper from '../components/PageWrapper.vue'
import { useRoute, useRouter } from 'vue-router'
import { useBlog } from '../composables/blog/useBlog'

const { fetchPostBySlug, fetchPosts } = useBlog()

const route = useRoute()

const loading = ref(false)
const error = ref('')
const post = ref({
  title: 'Sample Blog Post',
  publishedAt: '2025-08-29',
  readTime: 5,
  viewCount: 123,
  author: {
    name: 'Jane Doe',
    avatarUrl: '',
    bio: 'Tech writer and security expert.'
  },
  categories: [{ name: 'Security' }],
  tags: [{ id: 1, name: 'Vue', color: '#2566af' }],
  content: '# Hello World\nThis is a sample blog post.'
})

const relatedPosts = ref([])
const shareMessage = ref('')

const router = useRouter()

const hasAuthorLinks = computed(() => {
  if (!post.value?.author) return false
  const { website, twitterHandle, linkedinProfile, githubProfile } = post.value.author
  return website || twitterHandle || linkedinProfile || githubProfile
})

const renderedContent = computed(() => {
  if (!post.value?.content) return ''
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    headerPrefix: 'heading-',
  })
  try {
    return marked.parse(post.value.content)
  } catch (error) {
    console.error('Error parsing markdown:', error)
    return post.value.content
  }
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const sharePost = async () => {
  const url = window.location.href
  const title = post.value?.title || 'Tech Javelin Blog Post'
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        url,
        text: post.value?.summary || 'Check out this blog post from Tech Javelin'
      })
    } catch (err) {
      if (err.name !== 'AbortError') {
        copyToClipboard(url)
      }
    }
  } else {
    copyToClipboard(url)
  }
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    shareMessage.value = 'Link copied to clipboard!'
    setTimeout(() => {
      shareMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

const handleRelatedPostClick = (relatedPost) => {
  router.push(`/blog/${relatedPost.slug}`)
}

const loadRelatedPosts = async () => {
  if (!post.value) return
  try {
    // Get posts with similar categories or tags
    const result = await fetchPosts({
      status: 'PUBLISHED',
      limit: 3
    })
    let posts = []
    if (result && typeof result === 'object' && Array.isArray(result.data)) {
      posts = result.data
    }
    // Filter out current post and get first 3
    relatedPosts.value = posts
      .filter(p => p.id !== post.value.id)
      .slice(0, 3)
  } catch (err) {
    console.error('Error loading related posts:', err)
  }
}

const loadPost = async (slug) => {
  if (!slug) return
  
  try {
    await fetchPostBySlug(slug)
    if (post.value) {
      // Update page title
      document.title = `${post.value.title} | Tech Javelin Blog`
      
      // Update meta description
      if (post.value.metaDescription) {
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) {
          metaDesc.setAttribute('content', post.value.metaDescription)
        }
      }
      
      // Load related posts
      loadRelatedPosts()
    }
  } catch (err) {
    console.error('Error loading blog post:', err)
  }
}

// Watch for route changes
watch(() => route.params.slug, (newSlug) => {
  if (newSlug) {
    loadPost(newSlug)
  }
})

// Initialize
onMounted(() => {
  const slug = route.params.slug
  if (slug) {
    loadPost(slug)
  }
})
</script>

<style scoped>
.page-content {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

/* States */
.loading-state, .error-state {
  text-align: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2566af;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.back-to-blog {
  display: inline-block;
  color: #2566af;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 1px solid #2566af;
  border-radius: 4px;
  margin-top: 1rem;
  transition: all 0.2s ease;
}

.back-to-blog:hover {
  background-color: #2566af;
  color: white;
}

/* Blog Post Styles */
.blog-post {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-header {
  padding: 2rem;
  border-bottom: 1px solid #eee;
}

.breadcrumb {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
}

.breadcrumb a {
  color: #2566af;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.separator {
  margin: 0 0.5rem;
}

.post-title {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  color: #333;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 0.25rem;
}

.post-date-info {
  font-size: 0.9rem;
  color: #666;
}

.post-actions {
  display: flex;
  gap: 0.5rem;
}

.share-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s ease;
}

.share-btn:hover {
  background-color: #f5f5f5;
  color: #2566af;
}

.featured-image {
  margin-bottom: 2rem;
}

.post-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.post-summary {
  font-size: 1.2rem;
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  font-style: italic;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background-color: var(--tag-color, #2566af);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.table-of-contents {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem;
  border-left: 4px solid #2566af;
}

.table-of-contents h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.table-of-contents ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.table-of-contents li {
  margin: 0.5rem 0;
}

.table-of-contents a {
  color: #2566af;
  text-decoration: none;
  display: block;
  padding: 0.25rem 0;
}

.table-of-contents a:hover {
  text-decoration: underline;
}

.table-of-contents .level-1 {
  font-weight: 600;
}

.table-of-contents .level-2 {
  padding-left: 1rem;
}

.table-of-contents .level-3 {
  padding-left: 2rem;
  font-size: 0.9rem;
}

.post-content {
  padding: 2rem;
  line-height: 1.8;
  color: #333;
}

/* Content Typography */
.post-content h1,
.post-content h2,
.post-content h3,
.post-content h4,
.post-content h5,
.post-content h6 {
  margin: 2rem 0 1rem;
  color: #333;
  font-weight: 600;
  line-height: 1.3;
}

.post-content h1 {
  font-size: 2rem;
}

.post-content h2 {
  font-size: 1.5rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
}

.post-content h3 {
  font-size: 1.3rem;
}

.post-content h4 {
  font-size: 1.1rem;
}

.post-content h5 {
  font-size: 1rem;
}

.post-content h6 {
  font-size: 0.9rem;
  color: #666;
}

.post-content p {
  margin: 1rem 0;
  line-height: 1.7;
}

.post-content a {
  color: #2566af;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease;
}

.post-content a:hover {
  border-bottom-color: #2566af;
}

.post-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1.5rem auto;
  display: block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-content pre {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
  line-height: 1.4;
}

.post-content code {
  background: #f8f9fa;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #e83e8c;
  border: 1px solid #e9ecef;
}

.post-content pre code {
  background: none;
  padding: 0;
  border: none;
  color: #333;
  font-size: 0.9em;
}

.post-content blockquote {
  border-left: 4px solid #2566af;
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  background: #f8f9fa;
  color: #666;
  font-style: italic;
  border-radius: 0 8px 8px 0;
}

.post-content blockquote p {
  margin: 0.5rem 0;
}

.post-content blockquote p:first-child {
  margin-top: 0;
}

.post-content blockquote p:last-child {
  margin-bottom: 0;
}

.post-content ul,
.post-content ol {
  padding-left: 2rem;
  margin: 1rem 0;
}

.post-content ul {
  list-style-type: disc;
}

.post-content ol {
  list-style-type: decimal;
}

.post-content li {
  margin: 0.5rem 0;
  line-height: 1.6;
}

.post-content li > ul,
.post-content li > ol {
  margin: 0.5rem 0;
}

.post-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.post-content th,
.post-content td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.post-content th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.post-content tbody tr:hover {
  background-color: #f8f9fa;
}

.post-content hr {
  border: none;
  height: 2px;
  background: linear-gradient(to right, transparent, #e9ecef, transparent);
  margin: 2rem 0;
}

.post-content strong {
  font-weight: 600;
  color: #333;
}

.post-content em {
  font-style: italic;
  color: #666;
}

.post-content del {
  text-decoration: line-through;
  color: #999;
}

.post-content mark {
  background-color: #fff3cd;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.post-content kbd {
  background-color: #212529;
  color: white;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.85em;
}

.post-footer {
  padding: 2rem;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.post-categories {
  margin-bottom: 2rem;
}

.post-categories h4 {
  margin: 0 0 0.5rem;
  color: #333;
}

.categories-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-link {
  background-color: var(--category-color, #2566af);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.category-link:hover {
  opacity: 0.8;
}

.author-bio {
  margin-bottom: 2rem;
}

.author-card {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.author-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.author-info h4 {
  margin: 0 0 0.5rem;
  color: #333;
}

.author-info p {
  margin: 0 0 1rem;
  color: #666;
  line-height: 1.6;
}

.author-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.author-link {
  color: #2566af;
  text-decoration: none;
  font-size: 0.9rem;
}

.author-link:hover {
  text-decoration: underline;
}

.post-navigation {
  text-align: center;
}

/* Related Posts */
.related-posts {
  margin-top: 3rem;
  padding: 2rem;
}

.related-posts h3 {
  margin-bottom: 1.5rem;
  color: #333;
}

.related-posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .page-content {
    padding: 1rem;
  }

  .post-header {
    padding: 1.5rem;
  }

  .post-title {
    font-size: 2rem;
  }

  .post-meta {
    flex-direction: column;
    gap: 1rem;
  }

  .post-content {
    padding: 1.5rem;
  }

  .post-footer {
    padding: 1.5rem;
  }

  .author-card {
    flex-direction: column;
    text-align: center;
  }

  .author-avatar-large {
    margin: 0 auto;
  }

  .table-of-contents {
    margin: 1rem;
  }

  .related-posts-grid {
    grid-template-columns: 1fr;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .blog-post {
    background: #1a1a1a;
    color: #e0e0e0;
  }

  .post-header {
    border-bottom-color: #333;
  }

  .post-title {
    color: #e0e0e0;
  }

  .post-footer {
    background: #2a2a2a;
    border-top-color: #333;
  }

  .table-of-contents {
    background: #2a2a2a;
    color: #e0e0e0;
  }

  .post-content {
    color: #e0e0e0;
  }

  .post-content h1,
  .post-content h2,
  .post-content h3,
  .post-content h4,
  .post-content h5,
  .post-content h6 {
    color: #e0e0e0;
  }

  .post-content h2 {
    border-bottom-color: #333;
  }

  .post-content pre {
    background: #2a2a2a;
  }

  .post-content code {
    background: #2a2a2a;
  }

  .share-btn {
    border-color: #333;
    color: #e0e0e0;
  }

  .share-btn:hover {
    background-color: #333;
  }
}
</style>
