<template>
  <div class="blog-list" :class="[layoutClass, { 'loading': loading }]">
    <!-- Loading State -->
    <div v-if="loading && posts.length === 0" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading blog posts...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Unable to load blog posts</h3>
      <p>{{ error }}</p>
      <button @click="retry" class="retry-btn">Try Again</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && posts.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>No blog posts found</h3>
      <p v-if="filters.search">No posts match your search criteria.</p>
      <p v-else>There are no published blog posts yet.</p>
      <button v-if="filters.search" @click="clearFilters" class="clear-filters-btn">
        Clear Filters
      </button>
    </div>

    <!-- Blog Posts -->
    <div v-else class="posts-container">
      <!-- Filters and Search -->
      <div v-if="showFilters" class="filters-section">
        <div class="search-box">
          <input
            v-model="localFilters.search"
            @input="debouncedSearch"
            type="search"
            placeholder="Search blog posts..."
            class="search-input"
          >
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </div>

        <div class="filter-controls">
          <select v-model="localFilters.sortBy" @change="applyFilters" class="sort-select">
            <option value="publishedAt">Latest First</option>
            <option value="title">Title A-Z</option>
            <option value="viewCount">Most Popular</option>
            <option value="readTime">Quick Reads</option>
          </select>

          <select v-model="localFilters.category" @change="applyFilters" class="category-select">
            <option value="">All Categories</option>
            <option v-for="category in availableCategories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>

          <button 
            v-if="hasActiveFilters"
            @click="clearFilters" 
            class="clear-btn"
          >
            Clear All
          </button>
        </div>
      </div>

      <!-- Featured Posts (if enabled and available) -->
      <section v-if="showFeatured && featuredPosts.length > 0" class="featured-section">
        <h2 class="section-title">Featured Posts</h2>
        <div class="featured-posts" :class="featuredLayout">
          <BlogCard
            v-for="post in featuredPosts.slice(0, maxFeatured)"
            :key="post.id"
            :post="post"
            variant="featured"
            :show-tags="showTags"
            :show-views="showViews"
            :show-share="showShare"
            @click="handlePostClick"
            @share="handlePostShare"
          />
        </div>
      </section>

      <!-- Regular Posts -->
      <section class="posts-section">
        <h2 v-if="showFeatured" class="section-title">Latest Posts</h2>
        
        <div class="posts-grid" :class="gridLayout">
          <BlogCard
            v-for="post in regularPosts"
            :key="post.id"
            :post="post"
            :variant="cardVariant"
            :show-tags="showTags"
            :show-views="showViews"
            :show-share="showShare"
            :show-status="showStatus"
            @click="handlePostClick"
            @share="handlePostShare"
          />
        </div>

        <!-- Load More Button -->
        <div v-if="hasMore && !loading" class="load-more-section">
          <button @click="loadMore" class="load-more-btn" :disabled="loadingMore">
            <span v-if="loadingMore">Loading...</span>
            <span v-else>Load More Posts</span>
          </button>
        </div>

        <!-- Loading More Indicator -->
        <div v-if="loadingMore" class="loading-more">
          <div class="loading-spinner small"></div>
          <span>Loading more posts...</span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useBlogPosts } from '../composables/useBlog'
import BlogCard from './BlogCard.vue'

const props = defineProps({
  layout: {
    type: String,
    default: 'grid',
    validator: (value) => ['grid', 'list', 'masonry', 'compact'].includes(value)
  },
  columns: {
    type: Number,
    default: 3,
    validator: (value) => value >= 1 && value <= 4
  },
  showFilters: {
    type: Boolean,
    default: true
  },
  showFeatured: {
    type: Boolean,
    default: true
  },
  showTags: {
    type: Boolean,
    default: true
  },
  showViews: {
    type: Boolean,
    default: false
  },
  showShare: {
    type: Boolean,
    default: true
  },
  showStatus: {
    type: Boolean,
    default: false
  },
  maxFeatured: {
    type: Number,
    default: 2
  },
  pageSize: {
    type: Number,
    default: 12
  },
  initialFilters: {
    type: Object,
    default: () => ({})
  },
  status: {
    type: String,
    default: 'PUBLISHED',
    validator: (value) => ['PUBLISHED', 'DRAFT', 'ARCHIVED', 'ALL'].includes(value)
  }
})

const emit = defineEmits(['post-click', 'post-share', 'filters-change'])

// Blog posts composable
const {
  posts,
  loading,
  error,
  hasMore,
  featuredPosts,
  fetchPosts
} = useBlogPosts()

// Local state
const localFilters = ref({
  search: '',
  sortBy: 'publishedAt',
  category: '',
  ...props.initialFilters
})

const loadingMore = ref(false)
const availableCategories = ref([])
const searchTimeout = ref(null)

// Computed properties
const layoutClass = computed(() => `layout-${props.layout}`)

const cardVariant = computed(() => {
  switch (props.layout) {
    case 'compact':
      return 'compact'
    case 'list':
      return 'minimal'
    default:
      return 'default'
  }
})

const gridLayout = computed(() => {
  if (props.layout === 'list') return 'single-column'
  if (props.layout === 'compact') return 'compact-grid'
  return `columns-${props.columns}`
})

const featuredLayout = computed(() => {
  return props.maxFeatured > 1 ? 'featured-grid' : 'featured-single'
})

const regularPosts = computed(() => {
  if (!props.showFeatured) return posts.value
  return posts.value.filter(post => !post.featuredPost)
})

const hasActiveFilters = computed(() => {
  return localFilters.value.search || 
         localFilters.value.category || 
         localFilters.value.sortBy !== 'publishedAt'
})

const filters = computed(() => {
  const baseFilters = {
    status: props.status === 'ALL' ? undefined : props.status,
    limit: props.pageSize
  }

  if (localFilters.value.category) {
    baseFilters.categoryId = localFilters.value.category
  }

  return baseFilters
})

// Methods
const debouncedSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  searchTimeout.value = setTimeout(() => {
    applyFilters()
  }, 300)
}

const applyFilters = async () => {
  await fetchPosts(filters.value)
  emit('filters-change', localFilters.value)
}

const clearFilters = () => {
  localFilters.value = {
    search: '',
    sortBy: 'publishedAt',
    category: ''
  }
  applyFilters()
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  loadingMore.value = true
  try {
    await fetchPosts({ ...filters.value, append: true })
  } catch (err) {
    console.error('Error loading more posts:', err)
  } finally {
    loadingMore.value = false
  }
}

const retry = () => {
  applyFilters()
}

const handlePostClick = (post) => {
  emit('post-click', post)
}

const handlePostShare = (data) => {
  emit('post-share', data)
}

// Watch for filter changes
watch(
  () => props.initialFilters,
  (newFilters) => {
    localFilters.value = { ...localFilters.value, ...newFilters }
    applyFilters()
  },
  { deep: true }
)

// Initialize
onMounted(async () => {
  await applyFilters()
  
  // Load categories for filtering (if needed)
  // This would typically come from a categories composable
})
</script>

<style scoped>
.blog-list {
  width: 100%;
}

/* States */
.loading-state, .error-state, .empty-state {
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

.loading-spinner.small {
  width: 24px;
  height: 24px;
  border-width: 3px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state .error-icon,
.empty-state .empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state h3,
.empty-state h3 {
  color: #2566af;
  margin-bottom: 0.5rem;
}

.error-state p,
.empty-state p {
  color: #666;
  margin-bottom: 1.5rem;
}

.retry-btn, .clear-filters-btn {
  background: #2566af;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.retry-btn:hover, .clear-filters-btn:hover {
  background: #1e5294;
}

/* Filters Section */
.filters-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.search-box {
  position: relative;
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #2566af;
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  pointer-events: none;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.sort-select, .category-select {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
}

.sort-select:focus, .category-select:focus {
  outline: none;
  border-color: #2566af;
}

.clear-btn {
  background: transparent;
  color: #666;
  border: 2px solid #ccc;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  border-color: #999;
  color: #333;
}

/* Sections */
.featured-section, .posts-section {
  margin-bottom: 3rem;
}

.section-title {
  color: #2566af;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
}

/* Featured Posts */
.featured-posts.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.featured-posts.featured-single {
  max-width: 600px;
  margin: 0 auto;
}

/* Posts Grid */
.posts-grid {
  display: grid;
  gap: 2rem;
}

.posts-grid.columns-1 {
  grid-template-columns: 1fr;
}

.posts-grid.columns-2 {
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
}

.posts-grid.columns-3 {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.posts-grid.columns-4 {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.posts-grid.single-column {
  grid-template-columns: 1fr;
  max-width: 800px;
  margin: 0 auto;
}

.posts-grid.compact-grid {
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1rem;
}

/* Load More */
.load-more-section {
  text-align: center;
  margin-top: 3rem;
}

.load-more-btn {
  background: transparent;
  color: #2566af;
  border: 2px solid #2566af;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.load-more-btn:hover:not(:disabled) {
  background: #2566af;
  color: white;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  color: #666;
}

/* Layout Variations */
.layout-masonry .posts-grid {
  column-count: var(--columns, 3);
  column-gap: 2rem;
}

.layout-masonry .posts-grid > * {
  break-inside: avoid;
  margin-bottom: 2rem;
}

/* Dark Mode */
[data-theme="dark"] .filters-section {
  background: #2d2d2d;
  border-color: #444;
}

[data-theme="dark"] .search-input,
[data-theme="dark"] .sort-select,
[data-theme="dark"] .category-select {
  background: #1e1e1e;
  border-color: #444;
  color: #e0e0e0;
}

[data-theme="dark"] .search-input:focus,
[data-theme="dark"] .sort-select:focus,
[data-theme="dark"] .category-select:focus {
  border-color: #64b5f6;
}

[data-theme="dark"] .search-icon {
  color: #999;
}

[data-theme="dark"] .section-title {
  color: #64b5f6;
  border-bottom-color: #444;
}

[data-theme="dark"] .error-state h3,
[data-theme="dark"] .empty-state h3 {
  color: #64b5f6;
}

[data-theme="dark"] .error-state p,
[data-theme="dark"] .empty-state p {
  color: #c0c0c0;
}

[data-theme="dark"] .retry-btn,
[data-theme="dark"] .clear-filters-btn {
  background: #64b5f6;
  color: #121212;
}

[data-theme="dark"] .retry-btn:hover,
[data-theme="dark"] .clear-filters-btn:hover {
  background: #90caf9;
}

[data-theme="dark"] .load-more-btn {
  color: #64b5f6;
  border-color: #64b5f6;
}

[data-theme="dark"] .load-more-btn:hover:not(:disabled) {
  background: #64b5f6;
  color: #121212;
}

/* Responsive */
@media (max-width: 768px) {
  .filters-section {
    padding: 1rem;
  }
  
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .sort-select, .category-select, .clear-btn {
    width: 100%;
  }
  
  .posts-grid.columns-3,
  .posts-grid.columns-4 {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
  
  .posts-grid.compact-grid {
    grid-template-columns: 1fr;
  }
  
  .featured-posts.featured-grid {
    grid-template-columns: 1fr;
  }
  
  .layout-masonry .posts-grid {
    column-count: 2;
  }
}

@media (max-width: 480px) {
  .posts-grid {
    grid-template-columns: 1fr !important;
    gap: 1rem;
  }
  
  .layout-masonry .posts-grid {
    column-count: 1;
  }
  
  .section-title {
    font-size: 1.25rem;
  }
}
</style>
