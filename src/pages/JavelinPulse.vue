<template>
  <PageWrapper title="Javelin Pulse">
    <section class="pulse-hero pulse-bg">
      <div class="pulse-hero-flex">
        <h1 class="pulse-title">Javelin Pulse</h1>
        <p class="pulse-subtitle">
          The unified SaaS platform for secure, scalable, and extensible business applications.<br>
          <strong>Currently in MVP — Request early access below!</strong>
        </p>
      </div>
    </section>
    <section class="pulse-cta">
      <button class="pulse-btn" @click="showModal = true">Request Early Access</button>
    </section>
    <PulseInviteModal :show="showModal" @close="showModal = false" v-if="showModal" />
    <section class="pulse-features pulse-card">
      <div class="feature">
        <div class="feature-graphic">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="16" width="32" height="20" rx="4" fill="#2563eb"/><rect x="14" y="22" width="20" height="8" rx="2" fill="#60a5fa"/><rect x="20" y="28" width="8" height="4" rx="1" fill="#fff"/></svg>
        </div>
        <h2>Unified Platform</h2>
        <p>All your business modules—Pulse Client Hub, Pulse SigInt, and more—integrated in one seamless experience.</p>
      </div>
      <div class="feature">
        <div class="feature-graphic">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" fill="#2563eb"/><rect x="14" y="20" width="20" height="8" rx="4" fill="#fff"/><circle cx="24" cy="24" r="6" fill="#60a5fa"/></svg>
        </div>
        <h2>Enterprise-Grade Security</h2>
        <p>Built on AWS, Javelin Pulse delivers robust security, compliance, and reliability for your data and workflows.</p>
      </div>
      <div class="feature">
        <div class="feature-graphic">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="8" width="32" height="32" rx="8" fill="#60a5fa"/><rect x="16" y="16" width="16" height="16" rx="4" fill="#fff"/><rect x="20" y="20" width="8" height="8" rx="2" fill="#2563eb"/></svg>
        </div>
        <h2>Modular & Extensible</h2>
        <p>Choose the modules you need, add new capabilities as you grow, and customize your experience with ease.</p>
      </div>
      <div class="feature">
        <div class="feature-graphic">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><ellipse cx="24" cy="32" rx="16" ry="8" fill="#2563eb"/><ellipse cx="24" cy="20" rx="10" ry="4" fill="#60a5fa"/><ellipse cx="24" cy="12" rx="4" ry="2" fill="#fff"/></svg>
        </div>
        <h2>Expert Support</h2>
        <p>Backed by Tech Javelin's professional services team, you get guidance and support every step of the way.</p>
      </div>
    </section>
  <!-- h2 removed for more direct CTA, see above -->
  </PageWrapper>
</template>

<script setup>
import { ref } from 'vue'
import PageWrapper from '@/components/PageWrapper.vue'
import PulseInviteModal from '@/components/PulseInviteModal.vue'

const showModal = ref(false)
</script>

<style scoped>
/* Feature cards layout */
.pulse-features {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2.5rem;
  margin: 3rem 0 2rem 0;
}
/* Light mode card background */
/* Light mode card background and text */
.feature {
  background: var(--color-pulse-card, #fff);
  border-radius: 1.5rem;
  box-shadow: 0 2px 16px 0 rgba(30,64,175,0.08);
  padding: 2.5rem 2rem 2rem 2rem;
  min-width: 260px;
  max-width: 340px;
  flex: 1 1 300px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: box-shadow 0.2s;
}
.feature h2 {
  color: var(--color-text-light, #1e293b);
}
.feature p {
  color: var(--color-text-light, #334155);
}
@media (prefers-color-scheme: dark) {
  .feature {
    background: var(--color-surface-dark, #181a20);
  }
}
.feature:hover {
  box-shadow: 0 6px 32px 0 rgba(30,64,175,0.16);
}
.feature-graphic {
  margin-bottom: 1.2rem;
}
.feature h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.7rem;
  color: var(--color-text-light, #fff);
}
.feature p {
  font-size: 1.1rem;
  color: var(--color-text-secondary, #cbd5e1);
}
@media (max-width: 900px) {
  .pulse-features {
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }
  .feature {
    max-width: 95vw;
    min-width: 0;
    width: 100%;
  }
}
/* Responsive flex layout for hero section */
  .pulse-title {
    margin-bottom: 0;
    min-width: 320px;
  }
  .pulse-subtitle {
    font-size: 1.5rem;
    max-width: 700px;
  }
@media (min-width: 800px) {
  .pulse-hero-flex {
    flex-direction: row;
    align-items: flex-end;
    justify-content: center;
    gap: 3rem;
    text-align: left;
  }
  .pulse-title {
    margin-bottom: 0;
    min-width: 320px;
  }
  .pulse-subtitle {
    font-size: 1.5rem;
    max-width: 700px;
  }
}
@media (prefers-color-scheme: dark) {
  .pulse-hero {
    background: var(--color-pulse-bg);
    color: var(--color-text-light);
  }
}
.pulse-btn {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
  margin-top: 2rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(30,64,175,0.08);
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}
.pulse-hero-flex {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  text-align: center;
}

@media (min-width: 800px) {
  .pulse-hero-flex {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    text-align: center;
  }
  .pulse-title {
    margin-bottom: 0;
    min-width: 320px;
  }
  .pulse-subtitle {
    font-size: 1.5rem;
    max-width: 900px;
  }
}
.pulse-cta {
  text-align: center;
  margin: 3rem 0 2rem 0;
}
</style>
