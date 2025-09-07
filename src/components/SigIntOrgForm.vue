<template>
  <form @submit.prevent="onSubmit">
    <div class="form-group">
      <label for="name">Organization Name</label>
      <input id="name" v-model="form.name" required />
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
  org: { type: Object, default: null },
  isEdit: { type: Boolean, default: false }
})
const emit = defineEmits(['submit', 'cancel'])

const form = ref({
  name: ''
})

watch(() => props.org, (org) => {
  if (org) {
    form.value.name = org.name || ''
  } else {
    form.value.name = ''
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
