<template>
  <article 
    class="blog-card" 
    :class="[
      { 'featured': post.featuredPost },
      { 'clickable': clickable },
      variant
    ]"
    @click="handleClick"
  >
    <!-- Featured Badge -->
    <div v-if="post.featuredPost" class="featured-badge">
      <span>Featured</span>
    </div>

    <!-- Preview Image -->
    <div v-if="post.previewImageUrl" class="blog-image">
      <img 
        :src="post.previewImageUrl" 
        :alt="post.previewImageAlt || post.title"
        loading="lazy"
      >
    </div>

    <div class="blog-content">
      <!-- Meta Information -->
      <div class="blog-meta">
        <span v-if="post.author" class="author">
          <img 
            v-if="post.author.avatarUrl" 
            :src="post.author.avatarUrl" 
            :alt="post.author.name"
            class="author-avatar"
          >
          {{ post.author.name }}
        </span>
        
        <span class="date">
          {{ formatDate(post.publishedAt || post.createdAt) }}
        </span>
        
        <span v-if="post.readTime" class="read-time">
          {{ post.readTime }} min read
        </span>
        
        <span v-if="showViews && post.viewCount" class="view-count">
          {{ formatViews(post.viewCount) }} views
        </span>
      </div>

      <!-- Title -->
      <h2 class="blog-title">
        <router-link v-if="linkToPost" :to="`/blog/${post.slug}`" class="title-link">
          {{ post.title }}
        </router-link>
        <span v-else>{{ post.title }}</span>
      </h2>

      <!-- Summary/Excerpt -->
      <p v-if="post.summary || post.excerpt" class="blog-summary">
        {{ post.summary || post.excerpt }}
      </p>

      <!-- Tags -->
      <div v-if="showTags && tags.length > 0" class="blog-tags">
        <span 
          v-for="tag in tags.slice(0, maxTags)" 
          :key="tag.id"
          class="blog-tag"
          :style="{ backgroundColor: tag.color || '#2566af' }"
        >
          {{ tag.name }}
        </span>
        <span v-if="tags.length > maxTags" class="more-tags">
          +{{ tags.length - maxTags }}
        </span>
      </div>

      <!-- Action Section -->
      <div v-if="showActions" class="blog-actions">
        <router-link 
          :to="`/blog/${post.slug}`" 
          class="read-more-btn"
          aria-label="Read full article"
        >
          {{ actionText }}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
          </svg>
        </router-link>

        <!-- Social Share Buttons -->
        <div v-if="showShare" class="share-buttons">
          <button 
            @click="sharePost('twitter')"
            class="share-btn twitter"
            aria-label="Share on Twitter"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </button>
          
          <button 
            @click="sharePost('linkedin')"
            class="share-btn linkedin"
            aria-label="Share on LinkedIn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Status Badge (for admin/author view) -->
      <div v-if="showStatus && post.status !== 'PUBLISHED'" class="status-badge">
        <span :class="['status', post.status.toLowerCase()]">
          {{ post.status }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useTags } from '../composables/blog/useTags'
import { useAnalytics } from '../composables/blog/useAnalytics'

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'compact', 'featured', 'minimal'].includes(value)
  },
  clickable: {
    type: Boolean,
    default: false
  },
  linkToPost: {
    type: Boolean,
    default: true
  },
  showTags: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  showShare: {
    type: Boolean,
    default: false
  },
  showViews: {
    type: Boolean,
    default: false
  },
  showStatus: {
    type: Boolean,
    default: false
  },
  maxTags: {
    type: Number,
    default: 3
  },
  actionText: {
    type: String,
    default: 'Read More'
  }
})

const emit = defineEmits(['click', 'share'])

const { fetchPostTags, tags } = useTags()
const { logEvent } = useAnalytics()

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.post)
  }
}

const sharePost = async (platform) => {
  const url = `${window.location.origin}/blog/${props.post.slug}`
  const title = props.post.title
  const text = props.post.summary || props.post.excerpt || ''

  let shareUrl = ''
  
  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
      break
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
      break
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      break
  }

  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400')
    
    // Log share analytics
    await logEvent(props.post.id, 'SHARE', { platform })
    
    emit('share', { post: props.post, platform })
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

const formatViews = (count) => {
  if (count < 1000) {
    return count.toString()
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}K`
  } else {
    return `${(count / 1000000).toFixed(1)}M`
  }
}

// Load tags when component mounts
onMounted(async () => {
  if (props.showTags && props.post.id) {
    await fetchPostTags(props.post.id)
  }
})
</script>

<style scoped>
.blog-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
  position: relative;
}

.blog-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.blog-card.clickable {
  cursor: pointer;
}

.blog-card.featured {
  border: 2px solid #2566af;
  box-shadow: 0 6px 20px rgba(37, 102, 175, 0.2);
}

.blog-card.compact {
  display: flex;
  flex-direction: row;
}

.blog-card.compact .blog-image {
  width: 200px;
  flex-shrink: 0;
}

.blog-card.compact .blog-content {
  flex: 1;
}

.blog-card.minimal .blog-image {
  height: 150px;
}

/* Featured Badge */
.featured-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
}

.featured-badge span {
  background: #2566af;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Image */
.blog-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  position: relative;
}

.blog-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.blog-card:hover .blog-image img {
  transform: scale(1.05);
}

/* Content */
.blog-content {
  padding: 1.5rem;
}

.blog-card.compact .blog-content {
  padding: 1rem;
}

/* Meta */
.blog-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #666;
  flex-wrap: wrap;
}

.author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #2566af;
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.date, .read-time, .view-count {
  position: relative;
}

.date::before, .read-time::before, .view-count::before {
  content: '•';
  margin-right: 0.5rem;
  color: #ccc;
}

.date:first-child::before,
.author + .date::before {
  display: none;
}

/* Title */
.blog-title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 0.75rem;
  color: #1a365d;
}

.title-link {
  text-decoration: none;
  color: inherit;
  transition: color 0.3s ease;
}

.title-link:hover {
  color: #2566af;
}

/* Summary */
.blog-summary {
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Tags */
.blog-tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.blog-tag {
  background: #2566af;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.more-tags {
  color: #666;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

/* Actions */
.blog-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.read-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #2566af;
  text-decoration: none;
  font-weight: 600;
  border: 2px solid #2566af;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.read-more-btn:hover {
  background: #2566af;
  color: white;
}

.read-more-btn svg {
  transition: transform 0.3s ease;
}

.read-more-btn:hover svg {
  transform: translateX(2px);
}

/* Share Buttons */
.share-buttons {
  display: flex;
  gap: 0.5rem;
}

.share-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.share-btn.twitter {
  background: #1da1f2;
  color: white;
}

.share-btn.linkedin {
  background: #0077b5;
  color: white;
}

.share-btn:hover {
  transform: scale(1.1);
  opacity: 0.9;
}

/* Status Badge */
.status-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 2;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status.draft {
  background: #fbb6ce;
  color: #97266d;
}

.status.archived {
  background: #fed7cc;
  color: #c53030;
}

/* Dark Mode */
[data-theme="dark"] .blog-card {
  background: #1e1e1e;
  border-color: #404040;
  color: #e0e0e0;
}

[data-theme="dark"] .blog-title {
  color: #64b5f6;
}

[data-theme="dark"] .title-link:hover {
  color: #90caf9;
}

[data-theme="dark"] .blog-summary {
  color: #c0c0c0;
}

[data-theme="dark"] .blog-meta {
  color: #999;
}

[data-theme="dark"] .author {
  color: #64b5f6;
}

[data-theme="dark"] .read-more-btn {
  color: #64b5f6;
  border-color: #64b5f6;
}

[data-theme="dark"] .read-more-btn:hover {
  background: #64b5f6;
  color: #121212;
}

/* Responsive */
@media (max-width: 768px) {
  .blog-card.compact {
    flex-direction: column;
  }
  
  .blog-card.compact .blog-image {
    width: 100%;
    height: 200px;
  }
  
  .blog-content {
    padding: 1rem;
  }
  
  .blog-title {
    font-size: 1.1rem;
  }
  
  .blog-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .blog-meta {
    gap: 0.5rem;
  }
  
  .read-more-btn {
    align-self: stretch;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .blog-image {
    height: 150px;
  }
  
  .blog-meta {
    font-size: 0.8rem;
  }
  
  .blog-title {
    font-size: 1rem;
  }
}
</style>
