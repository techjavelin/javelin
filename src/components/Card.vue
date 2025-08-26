<template>
  <div 
    class="card" 
    :class="[variant, { 'has-action': !!actionText || !!actionUrl, 'has-background': !!backgroundImage }]"
    :style="backgroundImage ? { '--bg-image': backgroundImage } : {}"
    @click="handleCardClick"
  >
    <div class="card-content">
      <h3 v-if="title" class="card-title">{{ title }}</h3>
      <p v-if="description" class="card-description">{{ description }}</p>
      
      <!-- Slot for custom content -->
      <div v-if="$slots.default" class="card-slot">
        <slot />
      </div>
      
      <!-- Action button/link -->
      <component 
        v-if="actionText && actionUrl"
        :is="isExternalLink ? 'a' : 'router-link'"
        :to="!isExternalLink ? actionUrl : undefined"
        :href="isExternalLink ? actionUrl : undefined"
        :target="isExternalLink ? '_blank' : undefined"
        :rel="isExternalLink ? 'noopener noreferrer' : undefined"
        class="card-action"
        @click.stop
      >
        {{ actionText }}
      </component>
      
      <button 
        v-else-if="actionText && !actionUrl"
        class="card-action"
        @click.stop="$emit('action')"
      >
        {{ actionText }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  },
  actionUrl: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'service', 'info', 'outline'].includes(value)
  },
  clickable: {
    type: Boolean,
    default: false
  },
  backgroundImage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['action', 'click'])

const isExternalLink = computed(() => {
  return props.actionUrl && (props.actionUrl.startsWith('http') || props.actionUrl.startsWith('//'))
})

function handleCardClick() {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style scoped>
.card {
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: #fff;
  border: 1px solid #e0e0e0;
  position: relative;
  overflow: hidden;
}

.card.has-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: var(--bg-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.08;
  z-index: 1;
  border-radius: inherit;
}

.card-content {
  position: relative;
  z-index: 2;
}

.card.clickable {
  cursor: pointer;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* Service card variant - matches homepage style */
.card.service {
  background: linear-gradient(135deg, #2566af 0%, #4a8bc2 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 15px rgba(37, 102, 175, 0.2);
}

.card.service:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(37, 102, 175, 0.3);
}

.card.service .card-title {
  color: white;
}

.card.service .card-description {
  opacity: 0.9;
}

/* Info card variant */
.card.info {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
}

/* Outline card variant */
.card.outline {
  background: transparent;
  border: 2px solid #2566af;
}

.card.outline .card-title {
  color: #2566af;
}

/* Card content */
.card-content {
  text-align: left;
}

.card-title {
  font-size: 1.4rem;
  margin-bottom: 1rem;
  color: #2566af;
  font-weight: 600;
}

.card-description {
  line-height: 1.6;
  margin-bottom: 1.5rem;
  color: #666;
}

.card-slot {
  margin-bottom: 1.5rem;
}

/* Action button/link */
.card-action {
  color: #2566af;
  text-decoration: none;
  font-weight: bold;
  border: 2px solid #2566af;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  display: inline-block;
  transition: all 0.3s ease;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
}

.card-action:hover {
  background: #2566af;
  color: white;
}

/* Service variant action button */
.card.service .card-action {
  color: white;
  border-color: white;
}

.card.service .card-action:hover {
  background: white;
  color: #2566af;
}

/* Responsive design */
@media (max-width: 768px) {
  .card {
    padding: 1.5rem;
  }
  
  .card-title {
    font-size: 1.2rem;
  }
}

/* Dark mode styles */
[data-theme="dark"] .card {
  background: #1a1a1a;
  border-color: #333;
  color: #e0e0e0;
}

[data-theme="dark"] .card.has-background::before {
  opacity: 0.04;
}

[data-theme="dark"] .card:hover {
  background: #2d2d2d;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

[data-theme="dark"] .card.info {
  background: #2d2d2d;
  border-color: #444;
}

[data-theme="dark"] .card.outline {
  border-color: #64b5f6;
}

[data-theme="dark"] .card.outline .card-title {
  color: #64b5f6;
}

[data-theme="dark"] .card-title {
  color: #64b5f6;
}

[data-theme="dark"] .card-description {
  color: #c0c0c0;
}

[data-theme="dark"] .card-action {
  color: #64b5f6;
  border-color: #64b5f6;
}

[data-theme="dark"] .card-action:hover {
  background: #64b5f6;
  color: #121212;
}

/* Dark mode service cards remain unchanged as they already have good contrast */
[data-theme="dark"] .card.service {
  background: #1a1a1a;
  background-image: none;
  border: 1px solid #333;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}

[data-theme="dark"] .card.service:hover {
  background: #2d2d2d;
  background-image: none;
  box-shadow: 0 8px 30px rgba(100, 181, 246, 0.3);
  border-color: #64b5f6;
  transform: translateY(-5px);
}
</style>
