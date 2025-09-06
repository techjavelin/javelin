<template>
  <form @submit.prevent="onSubmit">
    <div class="form-group">
      <label for="name">Scope Name</label>
      <input id="name" v-model="form.name" required />
    </div>
    <div class="form-group">
      <label for="description">Description</label>
      <textarea id="description" v-model="form.description" rows="2" />
    </div>
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">{{ isEdit ? 'Update' : 'Create' }}</button>
      <button type="button" class="btn" @click="$emit('cancel')">Cancel</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  scope: { type: Object, default: null },
  isEdit: { type: Boolean, default: false }
})
const emit = defineEmits(['submit', 'cancel'])

const form = ref({
  name: '',
  description: ''
})

watch(() => props.scope, (scope) => {
  if (scope) {
    form.value.name = scope.name || ''
    form.value.description = scope.description || ''
  } else {
    form.value.name = ''
    form.value.description = ''
  }
}, { immediate: true })

function onSubmit() {
  emit('submit', { ...form.value })
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
</style>
