<template>
  <div class="page-content">
    <h1>About Tech Javelin</h1>
    <p>Tech Javelin is a professional technology consulting firm with extensive experience in delivering comprehensive technology solutions.</p>
    
    <section class="about-section">
      <h2>Our Mission</h2>
      <Card 
        variant="info"
        description="We help organizations take their IT programs to the next level by specializing in running corporate cloud-native IT infrastructure, allowing our clients to focus on what they do best."
      />
    </section>

    <section class="about-section">
      <h2>Our Expertise</h2>
      <CardGrid columns="3" gap="md">
        <Card
          variant="outline"
          title="Managed IT Services"
          description="Complete cloud-native IT infrastructure management"
        />
        <Card
          variant="outline"
          title="Technology Growth Strategy"
          description="Risk-based approach to technology planning and budgeting"
        />
        <Card
          variant="outline"
          title="Professional Services"
          description="Network of skilled professionals in Software, Cybersecurity, Project Management, Product, DevSecOps, and Infrastructure"
        />
      </CardGrid>
    </section>

    <section class="about-section">
      <h2>Why Choose Tech Javelin?</h2>
      <CardGrid columns="2" gap="sm">
        <Card 
          variant="info"
          background-image="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3ccircle cx='20' cy='20' r='2' fill='%23e3f2fd'/%3e%3ccircle cx='50' cy='20' r='2' fill='%23e3f2fd'/%3e%3ccircle cx='80' cy='20' r='2' fill='%23e3f2fd'/%3e%3ccircle cx='20' cy='50' r='2' fill='%23e3f2fd'/%3e%3ccircle cx='50' cy='50' r='2' fill='%23e3f2fd'/%3e%3ccircle cx='80' cy='50' r='2' fill='%23e3f2fd'/%3e%3ccircle cx='20' cy='80' r='2' fill='%23e3f2fd'/%3e%3ccircle cx='50' cy='80' r='2' fill='%23e3f2fd'/%3e%3ccircle cx='80' cy='80' r='2' fill='%23e3f2fd'/%3e%3c/svg%3e"
        >
          <template #default>
            <ul class="benefits-list">
              <li>Extensive experience in technology consulting</li>
              <li>Cloud-native infrastructure specialization</li>
              <li>Risk-based planning approach</li>
            </ul>
          </template>
        </Card>
        <Card 
          variant="info"
          background-image="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3ccircle cx='15' cy='15' r='1.5' fill='%23e8f4fd'/%3e%3ccircle cx='35' cy='15' r='1.5' fill='%23e8f4fd'/%3e%3ccircle cx='55' cy='15' r='1.5' fill='%23e8f4fd'/%3e%3ccircle cx='75' cy='15' r='1.5' fill='%23e8f4fd'/%3e%3ccircle cx='15' cy='35' r='1.5' fill='%23e8f4fd'/%3e%3ccircle cx='35' cy='35' r='1.5' fill='%23e8f4fd'/%3e%3ccircle cx='55' cy='35' r='1.5' fill='%23e8f4fd'/%3e%3ccircle cx='75' cy='35' r='1.5' fill='%23e8f4fd'/%3e%3ccircle cx='15' cy='55' r='1.5' fill='%23e8f4fd'/%3e%3ccircle cx='35' cy='55' r='1.5' fill='%23e8f4fd'/%3e%3ccircle cx='55' cy='55' r='1.5' fill='%23e8f4fd'/%3e%3ccircle cx='75' cy='55' r='1.5' fill='%23e8f4fd'/%3e%3c/svg%3e"
        >
          <template #default>
            <ul class="benefits-list">
              <li>Comprehensive professional services network</li>
              <li>Focus on scalable technology solutions</li>
              <li>Proven track record of success</li>
            </ul>
          </template>
        </Card>
      </CardGrid>
    </section>
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

.about-section {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.about-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.about-section h2 {
  color: #2566af;
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.benefits-list li {
  color: #2566af;
  padding: 0.5rem 0;
  font-size: 1rem;
  position: relative;
  padding-left: 1.5rem;
}

.benefits-list li:before {
  content: "✓";
  color: #2566af;
  font-weight: bold;
  position: absolute;
  left: 0;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .page-content {
    padding: 1rem;
  }
  
  .page-content h1 {
    font-size: 2rem;
  }
  
  .about-section h2 {
    font-size: 1.5rem;
  }
}

/* Dark mode styles */
[data-theme="dark"] .page-content h1 {
  color: #64b5f6;
}

[data-theme="dark"] .page-content > p {
  color: #c0c0c0;
}

[data-theme="dark"] .about-section h2 {
  color: #e0e0e0;
}

[data-theme="dark"] .benefits-list li {
  color: #c0c0c0;
}

[data-theme="dark"] .benefits-list li:before {
  color: #64b5f6;
}
</style>
