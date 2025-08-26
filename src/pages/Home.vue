<template>
  <div class="main-content">
    <h1>What We Do</h1>
    <p>Tech Javelin is a professional technology consulting firm with extensive experience in the following areas</p>
    
    <CardGrid columns="auto" gap="md">
            <Card
        variant="service"
        title="Managed Services"
        description="Let our experts help you take your IT programs to the next level with our Managed IT Services. We specialize in running your corporate cloud-native IT infrastructure so you can focus on what you do best!"
        action-text="Learn More >>"
        action-url="https://app.hellobonsai.com/f/580d21c4552152d?hide_header=true"
        background-image="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3e%3cdefs%3e%3clinearGradient id='cloud' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' stop-color='%23e8f4fd'/%3e%3cstop offset='100%25' stop-color='%23b3d9f7'/%3e%3c/linearGradient%3e%3c/defs%3e%3cellipse cx='50' cy='80' rx='25' ry='15' fill='url(%23cloud)'/%3e%3cellipse cx='80' cy='70' rx='30' ry='18' fill='url(%23cloud)'/%3e%3cellipse cx='110' cy='85' rx='20' ry='12' fill='url(%23cloud)'/%3e%3cellipse cx='140' cy='75' rx='25' ry='15' fill='url(%23cloud)'/%3e%3c/svg%3e"
      />
      
            <Card
        variant="service"
        title="Technology Growth Strategy"
        description="We can help you plan how to scale your technology, engineering, and security needs as your business grows and prioritize your technology spend so you don't break the bank through our risk-based approach to planning. Take the guesswork out of your forward-looking budgeting and forecasts!"
        action-text="Learn More >>"
        action-url="https://app.hellobonsai.com/f/580d21c4552152d?hide_header=true"
        background-image="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3e%3cpath d='M20 150 L50 120 L80 100 L110 80 L140 50 L170 30' stroke='%2387ceeb' stroke-width='2' fill='none'/%3e%3ccircle cx='20' cy='150' r='3' fill='%2387ceeb'/%3e%3ccircle cx='50' cy='120' r='3' fill='%2387ceeb'/%3e%3ccircle cx='80' cy='100' r='3' fill='%2387ceeb'/%3e%3ccircle cx='110' cy='80' r='3' fill='%2387ceeb'/%3e%3ccircle cx='140' cy='50' r='3' fill='%2387ceeb'/%3e%3ccircle cx='170' cy='30' r='3' fill='%2387ceeb'/%3e%3c/svg%3e"
      />
      
      <Card
        variant="service"
        title="Professional Services"
        description="If you need projects done, let us deliver for you! Our network includes highly skilled professionals in Software, Cybersecurity, Project Management, Product, DevSecOps, Infrastructure, and much, much more. Get in touch today and let's see how we can help you get more done!"
        action-text="Learn More >>"
        action-url="https://app.hellobonsai.com/f/580d21c4552152d?hide_header=true"
        background-image="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3e%3ccircle cx='70' cy='60' r='8' fill='%23b3d9f7'/%3e%3ccircle cx='100' cy='50' r='8' fill='%23b3d9f7'/%3e%3ccircle cx='130' cy='70' r='8' fill='%23b3d9f7'/%3e%3cpath d='M62 75 Q70 70 78 75 L78 95 L62 95 Z' fill='%23b3d9f7'/%3e%3cpath d='M92 65 Q100 60 108 65 L108 85 L92 85 Z' fill='%23b3d9f7'/%3e%3cpath d='M122 85 Q130 80 138 85 L138 105 L122 105 Z' fill='%23b3d9f7'/%3e%3c/svg%3e"
      />
    </CardGrid>
  </div>
</template>

<script setup>
import Card from '../components/Card.vue'
import CardGrid from '../components/CardGrid.vue'
</script>

<style scoped>
.main-content {
  padding: 2rem;
  text-align: center;
  background: #f7f7f7;
  min-height: auto;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.main-content h1 {
  color: #2566af;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.main-content > p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 3rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .main-content h1 {
    font-size: 2rem;
  }
}

/* Dark mode styles */
[data-theme="dark"] .main-content {
  background: #121212 !important;
  color: #e0e0e0;
}

[data-theme="dark"] .main-content h1 {
  color: #64b5f6;
}

[data-theme="dark"] .main-content > p {
  color: #c0c0c0;
}
</style>
