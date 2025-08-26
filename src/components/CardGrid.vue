<template>
  <div class="card-grid" :class="[`cols-${columns}`, `gap-${gap}`]">
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  columns: {
    type: [String, Number],
    default: 'auto',
    validator: (value) => {
      return value === 'auto' || ['1', '2', '3', '4', 1, 2, 3, 4].includes(value)
    }
  },
  gap: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  maxWidth: {
    type: String,
    default: '1200px'
  }
})
</script>

<style scoped>
.card-grid {
  display: grid;
  margin: 0 auto;
  max-width: v-bind(maxWidth);
}

/* Column configurations */
.card-grid.cols-auto {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.card-grid.cols-1 {
  grid-template-columns: 1fr;
}

.card-grid.cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.card-grid.cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.card-grid.cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

/* Gap configurations */
.card-grid.gap-sm {
  gap: 1rem;
}

.card-grid.gap-md {
  gap: 2rem;
}

.card-grid.gap-lg {
  gap: 3rem;
}

/* Responsive design */
@media (max-width: 1024px) {
  .card-grid.cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .card-grid.cols-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .card-grid.cols-2,
  .card-grid.cols-3,
  .card-grid.cols-4 {
    grid-template-columns: 1fr;
  }
  
  .card-grid.gap-lg {
    gap: 1.5rem;
  }
  
  .card-grid.gap-md {
    gap: 1.5rem;
  }
}
</style>
