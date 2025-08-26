<template>
  <div class="page-content">
    <h1>Blog</h1>
    <p>Stay up to date with the latest insights on technology, cybersecurity, and IT strategy from Tech Javelin.</p>
    
    <CardGrid columns="2" gap="lg">
      <Card
        variant="default"
        title="The Future of Cloud-Native Infrastructure"
        action-text="Read More →"
        action-url="#"
      >
        <template #default>
          <p class="post-meta">Published on March 15, 2025</p>
          <p>Discover how cloud-native infrastructure is transforming the way businesses operate and scale their technology solutions...</p>
        </template>
      </Card>

      <Card
        variant="default"
        title="DevSecOps: Integrating Security into Your Development Pipeline"
        action-text="Read More →"
        action-url="#"
      >
        <template #default>
          <p class="post-meta">Published on March 10, 2025</p>
          <p>Learn best practices for implementing security throughout your development lifecycle with our comprehensive DevSecOps guide...</p>
        </template>
      </Card>

      <Card
        variant="default"
        title="Technology Budgeting: A Risk-Based Approach"
        action-text="Read More →"
        action-url="#"
      >
        <template #default>
          <p class="post-meta">Published on March 5, 2025</p>
          <p>Take the guesswork out of your technology spending with our proven risk-based approach to budgeting and forecasting...</p>
        </template>
      </Card>

      <Card
        variant="default"
        title="Building Scalable IT Infrastructure for Growing Businesses"
        action-text="Read More →"
        action-url="#"
      >
        <template #default>
          <p class="post-meta">Published on February 28, 2025</p>
          <p>Explore strategies for scaling your IT infrastructure as your business grows, without breaking the bank...</p>
        </template>
      </Card>
    </CardGrid>

    <Card 
      variant="info" 
      class="blog-cta"
      background-image="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3e%3crect x='50' y='60' width='100' height='60' rx='5' fill='%23f0f7ff'/%3e%3cpath d='M60 75 L90 90 L120 75 L140 85 L140 110 L60 110 Z' fill='%23e1f1ff'/%3e%3ccircle cx='70' cy='85' r='2' fill='%236ba3d6'/%3e%3ccircle cx='130' cy='95' r='2' fill='%236ba3d6'/%3e%3c/svg%3e"
    >
      <template #default>
        <h3>Want to stay updated?</h3>
        <p>Subscribe to our newsletter for the latest insights and updates from Tech Javelin.</p>
        <a href="#" class="cta-button">Subscribe Now</a>
      </template>
    </Card>
  </div>
</template>

<script setup>
import Card from '../components/Card.vue'
import CardGrid from '../components/CardGrid.vue'
</script>

<style scoped>
.page-content {
  padding: 2rem;
  text-align: center;
  min-height: auto;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.page-content h1 {
  color: #2566af;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.page-content > p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 3rem;
  line-height: 1.6;
}

.post-meta {
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
  margin-bottom: 1rem !important;
}

.blog-cta {
  margin-top: 3rem;
  text-align: center;
}

.blog-cta h3 {
  color: #2566af;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.blog-cta p {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.cta-button {
  display: inline-block;
  background: #2566af;
  color: white;
  padding: 0.8rem 2rem;
  text-decoration: none;
  border-radius: 6px;
  font-weight: bold;
  transition: background 0.3s ease;
}

.cta-button:hover {
  background: #174a7c;
}

@media (max-width: 768px) {
  .page-content {
    padding: 1rem;
  }
  
  .page-content h1 {
    font-size: 2rem;
  }
}

/* Dark mode styles */
[data-theme="dark"] .page-content h1 {
  color: #64b5f6;
}

[data-theme="dark"] .page-content > p {
  color: #c0c0c0;
}

[data-theme="dark"] .post-meta {
  color: #c0c0c0;
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
}

[data-theme="dark"] .cta-button:hover {
  background: #42a5f5;
}
</style>
