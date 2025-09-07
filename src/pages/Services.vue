<template>
  <PageWrapper>
    <div class="services-container">
      <h1>Javelin Pulse Services</h1>
      <p>Javelin Pulse integrates Tech Javelin's professional technology consulting and managed services into a unified SaaS platform. Explore our modular service portfolio, including client portals, OSINT monitoring, and more.</p>
      <Card 
        variant="info" 
        class="intro-card"
        background-image="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3cpath d='M0 0 L20 0 L20 20 L0 20 Z M40 0 L60 0 L60 20 L40 20 Z M80 0 L100 0 L100 20 L80 20 Z M20 20 L40 20 L40 40 L20 40 Z M60 20 L80 20 L80 40 L60 40 Z M0 40 L20 40 L20 60 L0 60 Z M40 40 L60 40 L60 60 L40 60 Z M80 40 L100 40 L100 60 L80 60 Z' fill='%23f0f8ff' opacity='0.3'/%3e%3c/svg%3e"
      >
        <h2>Our Service Portfolio</h2>
        <p>
          With decades of experience in enterprise technology and software development, Tech Javelin 
          provides comprehensive consulting services to help your business achieve its technology goals.
        </p>
      </Card>
      <CardGrid columns="2" gap="lg" class="main-services-grid">
      <Card 
        variant="service"
        title="Managed IT Services"
        action-text="Learn More →"
        action-url="https://app.hellobonsai.com/f/580d21c4552152d?hide_header=true"
        background-image="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3e%3cellipse cx='50' cy='80' rx='25' ry='15' fill='%23e8f4fd'/%3e%3cellipse cx='80' cy='70' rx='30' ry='18' fill='%23e8f4fd'/%3e%3cellipse cx='110' cy='85' rx='20' ry='12' fill='%23e8f4fd'/%3e%3cellipse cx='140' cy='75' rx='25' ry='15' fill='%23e8f4fd'/%3e%3c/svg%3e"
      >
        <template #default>
          <p class="service-description">
            Let our experts help you take your IT programs to the next level with our Managed IT Services. We specialize in running your corporate cloud-native IT infrastructure so you can focus on what you do best!
          </p>
          <div class="service-features">
            <h4>What We Offer:</h4>
            <ul class="feature-list">
              <li>Complete cloud-native IT infrastructure management</li>
              <li>24/7 monitoring and support</li>
              <li>Proactive maintenance and updates</li>
              <li>Security and compliance management</li>
              <li>Disaster recovery and backup solutions</li>
            </ul>
          </div>
        </template>
      </Card>

      <Card 
        title="Technology Growth Strategy"
        action-text="Learn More →"
        action-url="https://app.hellobonsai.com/f/580d21c4552152d?hide_header=true"
        background-image="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3e%3cpath d='M20 150 L50 120 L80 100 L110 80 L140 50 L170 30' stroke='%2387ceeb' stroke-width='2' fill='none'/%3e%3ccircle cx='20' cy='150' r='3' fill='%2387ceeb'/%3e%3ccircle cx='50' cy='120' r='3' fill='%2387ceeb'/%3e%3ccircle cx='80' cy='100' r='3' fill='%2387ceeb'/%3e%3ccircle cx='110' cy='80' r='3' fill='%2387ceeb'/%3e%3ccircle cx='140' cy='50' r='3' fill='%2387ceeb'/%3e%3ccircle cx='170' cy='30' r='3' fill='%2387ceeb'/%3e%3c/svg%3e"
      >
        <template #default>
          <p class="service-description">
            We can help you plan how to scale your technology, engineering, and security needs as your business grows and prioritize your technology spend so you don't break the bank through our risk-based approach to planning.
          </p>
          <div class="service-features">
            <h4>Our Approach:</h4>
            <ul class="feature-list">
              <li>Risk-based technology planning</li>
              <li>Scalable architecture design</li>
              <li>Forward-looking budgeting and forecasts</li>
              <li>Technology roadmap development</li>
              <li>Security integration planning</li>
            </ul>
          </div>
        </template>
      </Card>

      <Card 
        variant="service"
        title="Program Management"
        action-text="Learn More →"
        action-url="https://app.hellobonsai.com/f/580d21c4552152d?hide_header=true"
      >
        <template #default>
          <p class="service-description">
            Let our expert program management staff help you build your technology and security programs. We've worked with some of the biggest companies and have seen what works and what doesn't.
          </p>
          <div class="service-features">
            <h4>Our Expertise:</h4>
            <ul class="feature-list">
              <li>Technology program development</li>
              <li>Security program implementation</li>
              <li>Enterprise-level project coordination</li>
              <li>Best practices from industry leaders</li>
              <li>Risk management and mitigation</li>
            </ul>
          </div>
        </template>
      </Card>

      <Card 
        variant="service"
        title="Professional Services"
        action-text="Contact Us →"
        action-url="https://app.hellobonsai.com/f/580d21c4552152d?hide_header=true"
        background-image="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3e%3ccircle cx='70' cy='60' r='8' fill='%23b3d9f7'/%3e%3ccircle cx='100' cy='50' r='8' fill='%23b3d9f7'/%3e%3ccircle cx='130' cy='70' r='8' fill='%23b3d9f7'/%3e%3cpath d='M62 75 Q70 70 78 75 L78 95 L62 95 Z' fill='%23b3d9f7'/%3e%3cpath d='M92 65 Q100 60 108 65 L108 85 L92 85 Z' fill='%23b3d9f7'/%3e%3cpath d='M122 85 Q130 80 138 85 L138 105 L122 105 Z' fill='%23b3d9f7'/%3e%3c/svg%3e"
      >
        <template #default>
          <p class="service-description">
            If you need projects done, let us deliver for you! Our network includes highly skilled professionals across multiple technology domains.
          </p>
          <div class="professional-services">
            <div class="service-category">
              <div class="category-header">
                <h4 class="category-title">
                  <svg class="category-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.1 16,12.7V16.2C16,16.8 15.4,17.3 14.7,17.3H9.2C8.6,17.3 8,16.8 8,16.2V12.7C8,12.1 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z"/>
                  </svg>
                  Security Services
                </h4>
              </div>
              <ul class="category-list">
                <li>Advisory Services</li>
                <li>Security Engineering</li>
                <li>DevSecOps Implementation</li>
                <li>Secure Architecture Review</li>
              </ul>
            </div>
            
            <div class="service-category">
              <div class="category-header">
                <h4 class="category-title">
                  <svg class="category-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4,6H20V16H4M20,18A2,2 0 0,0 22,16V6C22,4.89 21.1,4 20,4H4C2.89,4 2,4.89 2,6V16A2,2 0 0,0 4,18H0V20H24V18H20Z"/>
                  </svg>
                  Development & Engineering
                </h4>
              </div>
              <ul class="category-list">
                <li>Software Development</li>
                <li>Infrastructure Engineering</li>
                <li>Cloud Migration</li>
                <li>DevOps Implementation</li>
              </ul>
            </div>
            
            <div class="service-category">
              <div class="category-header">
                <h4 class="category-title">
                  <svg class="category-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z"/>
                  </svg>
                  Fractional Leadership
                </h4>
              </div>
              <ul class="category-list">
                <li>Executive Technology Leadership</li>
                <li>Startup Technology Guidance</li>
                <li>Technology Team Building</li>
                <li>Strategic Technology Planning</li>
              </ul>
            </div>
          </div>
        </template>
      </Card>
      </CardGrid>
    </div>
  </PageWrapper>
</template>

<script setup>
import Card from '../components/Card.vue'
import CardGrid from '../components/CardGrid.vue'
</script>

<style scoped>
/* Services main container for max-width and padding */
.services-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 2rem;
  padding-right: 2rem;
  box-sizing: border-box;
}
@media (max-width: 600px) {
  .services-container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
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



.intro-card h2 {
  color: #2566af;
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.intro-card p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.services-contact h3 {
  color: #2566af;
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.main-services-grid {
  margin-bottom: 2rem;
}

.service-description {
  font-size: 1rem;
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  text-align: left;
}

.service-features {
  margin: 1.5rem 0;
  text-align: left;
}

.service-features h4 {
  color: #2566af;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  padding: 0.75rem 0;
  color: #555;
  position: relative;
  padding-left: 2rem;
  line-height: 1.4;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
}

.feature-list li:last-child {
  margin-bottom: 0;
}

.feature-list li:before {
  content: "✓";
  color: #2566af;
  font-weight: bold;
  position: absolute;
  left: 0.5rem;
  top: 0.75rem;
  width: 16px;
  height: 16px;
  background: transparent;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.feature-list li:hover {
  padding-left: 2.2rem;
  border-radius: 6px;
}

.professional-services {
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.service-category {
  background: rgba(37, 102, 175, 0.02);
  border: 1px solid rgba(37, 102, 175, 0.1);
  border-radius: 8px;
  padding: 1.25rem;
  transition: all 0.2s ease;
}

.service-category:hover {
  border-color: rgba(37, 102, 175, 0.2);
  background: rgba(37, 102, 175, 0.05);
}

.category-header {
  margin-bottom: 0.75rem;
}

.category-title {
  color: #2566af;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-icon {
  width: 18px;
  height: 18px;
  color: #2566af;
  flex-shrink: 0;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 1rem;
}

.category-list li {
  padding: 0.3rem 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.3;
  position: relative;
  padding-left: 1rem;
}

.category-list li:before {
  content: "•";
  color: #2566af;
  font-weight: bold;
  position: absolute;
  left: 0;
  top: 0.3rem;
}

.category-list li:hover {
  color: #2566af;
}

@media (max-width: 768px) {
  .page-content {
    padding: 1rem;
  }
  
  .page-content h1 {
    font-size: 2rem;
  }
  
  .feature-list li {
    padding: 0.5rem 0;
    padding-left: 1.8rem;
  }
  
  .feature-list li:hover {
    padding-left: 1.8rem;
  }
  
  .category-list {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}

/* Light mode explicit styles for better readability */
[data-theme="light"] .page-content h1 {
  color: #1a365d;
}

[data-theme="light"] .page-content > p {
  color: #4a5568;
}

[data-theme="light"] .intro-card h2 {
  color: #2566af;
}

[data-theme="light"] .intro-card p {
  color: #4a5568;
}

[data-theme="light"] .services-contact h3 {
  color: #2566af;
}

[data-theme="light"] .service-description {
  color: #4a5568;
}

[data-theme="light"] .service-features h4,
[data-theme="light"] .sub-service-card h4 {
  color: #2566af;
}

[data-theme="light"] .feature-list li {
  color: #4a5568;
}

[data-theme="light"] .feature-list li:before {
  color: #2566af;
}

[data-theme="light"] .contact-button,
[data-theme="light"] .service-cta {
  background: #2566af;
  color: white;
}

[data-theme="light"] .contact-button:hover,
[data-theme="light"] .service-cta:hover {
  background: #1e5294;
}

/* Dark mode styles */
[data-theme="dark"] .page-content h1 {
  color: #64b5f6;
}

[data-theme="dark"] .page-content > p {
  color: #c0c0c0;
}

[data-theme="dark"] .intro-card h2 {
  color: #64b5f6;
}

[data-theme="dark"] .intro-card p {
  color: #c0c0c0;
}

[data-theme="dark"] .services-contact h3 {
  color: #64b5f6;
}

[data-theme="dark"] .service-description {
  color: #c0c0c0;
}

[data-theme="dark"] .service-features h4,
[data-theme="dark"] .sub-service-card h4 {
  color: #64b5f6;
}

[data-theme="dark"] .feature-list li {
  color: #c0c0c0;
}

[data-theme="dark"] .feature-list li:before {
  background: transparent;
  color: #64b5f6;
}

[data-theme="dark"] .feature-list li:hover {
  border-radius: 6px;
}

[data-theme="dark"] .service-category {
  background: rgba(100, 181, 246, 0.03);
  border-color: rgba(100, 181, 246, 0.15);
}

[data-theme="dark"] .service-category:hover {
  border-color: rgba(100, 181, 246, 0.3);
  background: rgba(100, 181, 246, 0.08);
}

[data-theme="dark"] .category-title {
  color: #64b5f6;
}

[data-theme="dark"] .category-icon {
  color: #64b5f6;
}

[data-theme="dark"] .category-list li {
  color: #c0c0c0;
}

[data-theme="dark"] .category-list li:before {
  color: #64b5f6;
}

[data-theme="dark"] .category-list li:hover {
  color: #64b5f6;
}

[data-theme="dark"] .sub-feature-list li {
  color: #c0c0c0;
}

[data-theme="dark"] .sub-feature-list li:before {
  color: #64b5f6;
}

[data-theme="dark"] .sub-feature-list li:hover {
  color: #64b5f6;
}

[data-theme="dark"] .service-features li {
  color: #c0c0c0;
}

[data-theme="dark"] .service-features li:before {
  color: #64b5f6;
}

[data-theme="dark"] .contact-button,
[data-theme="dark"] .service-cta {
  background: #64b5f6;
  color: #121212;
}

[data-theme="dark"] .contact-button:hover,
[data-theme="dark"] .service-cta:hover {
  background: #90caf9;
  color: #000;
}
</style>
