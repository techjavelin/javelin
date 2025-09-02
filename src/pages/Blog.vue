<template>
  <PageWrapper>
    <div class="blog-header">
      <h1>Javelin Pulse Blog</h1>
      <p>
        Stay up to date with the latest insights on technology, cybersecurity, and IT strategy from the Javelin Pulse platform and Tech Javelin experts.
      </p>
    </div>

    <!-- Newsletter Signup -->
    <div class="newsletter-signup">
      <div class="newsletter-content">
        <h3>🚀 Stay Updated</h3>
        <p>Get the latest tech insights delivered to your inbox</p>
        <form @submit.prevent="handleNewsletterSignup" class="newsletter-form">
          <div class="form-group">
            <input
              v-model="newsletterEmail"
              type="email"
              placeholder="Your email address"
              required
              class="email-input"
              :disabled="newsletterLoading"
            >
            <button 
              type="submit" 
              class="subscribe-btn"
              :disabled="newsletterLoading"
            >
              <span v-if="newsletterLoading">Subscribing...</span>
              <span v-else>Subscribe</span>
            </button>
          </div>
          <p v-if="newsletterMessage" :class="['message', messageType]">
            {{ newsletterMessage }}
          </p>
        </form>
      </div>
    </div>

    <!-- Blog Posts List -->
    <BlogList
      :layout="viewMode"
      :columns="gridColumns"
      :show-filters="true"
      :show-featured="true"
      :show-tags="true"
      :show-views="false"
      :show-share="true"
      :page-size="12"
      :initial-filters="initialFilters"
      @post-click="handlePostClick"
      @post-share="handlePostShare"
      @filters-change="handleFiltersChange"
    />

    <!-- View Toggle -->
    <div class="view-controls">
      <label>View:</label>
      <div class="view-buttons">
        <button 
          @click="viewMode = 'grid'" 
          :class="['view-btn', { active: viewMode === 'grid' }]"
          aria-label="Grid view"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10,4V8H14V4H10M16,4V8H20V4H16M16,10V14H20V10H16M16,16V20H20V16H16M14,20V16H10V20H14M8,20V16H4V20H8M8,14V10H4V14H8M8,8V4H4V8H8M14,14V10H10V14H14M6,2H18A2,2 0 0,1 20,4V18A2,2 0 0,1 18,20H6A2,2 0 0,1 4,18V4A2,2 0 0,1 6,2Z"/>
          </svg>
        </button>
        <button 
          @click="viewMode = 'list'" 
          :class="['view-btn', { active: viewMode === 'list' }]"
          aria-label="List view"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9,5V9H21V5M9,19H21V15H9M9,14H21V10H9M4,9H8V5H4M4,19H8V15H4M4,14H8V10H4V14Z"/>
          </svg>
        </button>
        <button 
          @click="viewMode = 'compact'" 
          :class="['view-btn', { active: viewMode === 'compact' }]"
          aria-label="Compact view"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3,5H9V11H3V5M5,7V9H7V7H5M11,7H21V9H11V7M11,15H21V17H11V15M5,20V18H7V20H5M3,13H9V19H3V13Z"/>
          </svg>
        </button>
      </div>

      <div v-if="viewMode === 'grid'" class="columns-control">
        <label>Columns:</label>
        <select v-model="gridColumns" class="columns-select">
          <option :value="2">2</option>
          <option :value="3">3</option>
          <option :value="4">4</option>
        </select>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="blog-cta">
      <h3>Ready to Transform Your Technology Strategy?</h3>
      <p>
        Our team of experts is here to help you navigate the complex world of technology 
        and develop strategies that drive real business results.
      </p>
      <a 
        href="https://app.hellobonsai.com/f/580d21c4552152d?hide_header=true" 
        target="_blank" 
        class="cta-button"
      >
        Get Started Today →
      </a>
    </div>
  </PageWrapper>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BlogList from '../components/BlogList.vue'
import { useRouter } from 'vue-router'

const newsletterEmail = ref('')
const newsletterMessage = ref('')
const messageType = ref('')
const newsletterLoading = ref(false)

const viewMode = ref('grid')
const gridColumns = ref(3)
const initialFilters = ref({})
const router = useRouter()

const handleNewsletterSignup = async () => {
  if (!newsletterEmail.value) return
  newsletterLoading.value = true
  setTimeout(() => {
    newsletterMessage.value = 'Successfully subscribed! Welcome to our newsletter.'
    messageType.value = 'success'
    newsletterEmail.value = ''
    newsletterLoading.value = false
    setTimeout(() => {
      newsletterMessage.value = ''
      messageType.value = ''
    }, 5000)
  }, 1200)
}

const handlePostClick = (post) => {
  router.push(`/blog/${post.slug}`)
}

const handlePostShare = (data) => {
  console.log('Post shared:', data)
}

const handleFiltersChange = (filters) => {
  console.log('Filters changed:', filters)
}

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const category = urlParams.get('category')
  const search = urlParams.get('search')
  if (category || search) {
    initialFilters.value = {
      ...(category && { category }),
      ...(search && { search })
    }
  }
})
</script>
          <style scoped>
.page-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.blog-header {
  text-align: center;
  margin-bottom: 3rem;
}

.blog-header h1 {
  color: #1a365d;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.blog-header p {
  font-size: 1.2rem;
  color: #4a5568;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Newsletter Signup */
.newsletter-signup {
  background: #f8faff;
  border: 2px solid #e0e7ff;
  border-radius: 16px;
  padding: 2.5rem;
  margin-bottom: 3rem;
  text-align: center;
}

.newsletter-content h3 {
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
  color: #1a365d;
  font-weight: 600;
}

.newsletter-content p {
  margin-bottom: 1.5rem;
  color: #4a5568;
  font-size: 1.1rem;
  line-height: 1.6;
}

.newsletter-form {
  max-width: 400px;
  margin: 0 auto;
}

.form-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.email-input {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  color: #2d3748;
  transition: all 0.3s ease;
}

.email-input:focus {
  outline: none;
  border-color: #2566af;
  box-shadow: 0 0 0 3px rgba(37, 102, 175, 0.1);
}

.email-input::placeholder {
  color: #a0aec0;
}

.subscribe-btn {
  background: #2566af;
  color: white;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(37, 102, 175, 0.2);
  white-space: nowrap;
}

.subscribe-btn:hover:not(:disabled) {
  background: #1e5294;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(37, 102, 175, 0.3);
}

.subscribe-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.message {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.message.success {
  color: #68d391;
}

.message.error {
  color: #fc8181;
}

/* View Controls */
.view-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.view-controls label {
  font-weight: 600;
  color: #2566af;
}

.view-buttons {
  display: flex;
  gap: 0.25rem;
  background: white;
  border-radius: 6px;
  padding: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.view-btn {
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-btn:hover {
  color: #2566af;
  background: #f0f7ff;
}

.view-btn.active {
  background: #2566af;
  color: white;
}

.columns-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.columns-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

/* CTA Section */
.blog-cta {
  text-align: center;
  padding: 3rem 2rem;
  background: #f8faff;
  border-radius: 12px;
  margin-top: 4rem;
  border: 1px solid #e0e7ff;
}

.blog-cta h3 {
  color: #2566af;
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.blog-cta p {
  color: #4a5568;
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto 2rem;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #2566af;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(37, 102, 175, 0.3);
}

.cta-button:hover {
  background: #1e5294;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 102, 175, 0.4);
}

/* Dark Mode */
[data-theme="dark"] .blog-header h1 {
  color: #64b5f6;
}

[data-theme="dark"] .blog-header p {
  color: #c0c0c0;
}

/* Newsletter Dark Mode */
[data-theme="dark"] .newsletter-signup {
  background: #1e1e1e;
  border-color: #404040;
}

[data-theme="dark"] .newsletter-content h3 {
  color: #64b5f6;
}

[data-theme="dark"] .newsletter-content p {
  color: #c0c0c0;
}

[data-theme="dark"] .email-input {
  background: #2d2d2d;
  border-color: #404040;
  color: #e0e0e0;
}

[data-theme="dark"] .email-input:focus {
  border-color: #64b5f6;
  box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.1);
}

[data-theme="dark"] .email-input::placeholder {
  color: #888;
}

[data-theme="dark"] .subscribe-btn {
  background: #64b5f6;
  color: #121212;
  box-shadow: 0 2px 4px rgba(100, 181, 246, 0.2);
}

[data-theme="dark"] .subscribe-btn:hover:not(:disabled) {
  background: #90caf9;
  box-shadow: 0 4px 8px rgba(100, 181, 246, 0.3);
}

[data-theme="dark"] .view-controls {
  background: #2d2d2d;
}

[data-theme="dark"] .view-controls label {
  color: #64b5f6;
}

[data-theme="dark"] .view-buttons {
  background: #1e1e1e;
}

[data-theme="dark"] .view-btn {
  color: #999;
}

[data-theme="dark"] .view-btn:hover {
  color: #64b5f6;
  background: rgba(100, 181, 246, 0.1);
}

[data-theme="dark"] .view-btn.active {
  background: #64b5f6;
  color: #121212;
}

[data-theme="dark"] .columns-select {
  background: #1e1e1e;
  border-color: #444;
  color: #e0e0e0;
}

[data-theme="dark"] .blog-cta {
  background: #1e1e1e;
  border-color: #404040;
}

[data-theme="dark"] .blog-cta h3 {
  color: #64b5f6;
}

[data-theme="dark"] .blog-cta p {
  color: #c0c0c0;
}

[data-theme="dark"] .cta-button {
  background: #64b5f6;
  color: #121212;
  box-shadow: 0 4px 12px rgba(100, 181, 246, 0.3);
}

[data-theme="dark"] .cta-button:hover {
  background: #90caf9;
  box-shadow: 0 6px 16px rgba(100, 181, 246, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .page-content {
    padding: 1rem;
  }
  
  .blog-header h1 {
    font-size: 2rem;
  }
  
  .newsletter-signup {
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .newsletter-content h3 {
    font-size: 1.25rem;
  }
  
  .newsletter-content p {
    font-size: 1rem;
    margin-bottom: 1.25rem;
  }
  
  .form-group {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .email-input,
  .subscribe-btn {
    width: 100%;
  }
  
  .view-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .columns-control {
    margin-left: 0;
    justify-content: center;
  }
  
  .blog-cta {
    padding: 2rem 1rem;
  }
  
  .blog-cta h3 {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .blog-header h1 {
    font-size: 1.75rem;
  }
  
  .view-buttons {
    width: 100%;
    justify-content: center;
  }
}
</style>


