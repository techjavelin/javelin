<template>
  <form @submit.prevent="onSubmit">
    <div class="form-group">
      <label for="name">Target Name</label>
      <input id="name" v-model="form.name" required />
    </div>
    <div class="form-group">
      <label for="type">Type</label>
      <select id="type" v-model="form.type" required>
  <option v-for="option in targetTypes" :key="String(option)" :value="option">{{ option }}</option>
      </select>
    </div>
    <div class="form-group">
      <label for="config">Config (JSON)</label>
      <textarea id="config" v-model="form.configString" rows="2" placeholder="{}" />
    </div>
    <div class="form-group">
      <label for="metadata">Metadata (JSON)</label>
      <textarea id="metadata" v-model="form.metadataString" rows="2" placeholder="{}" />
    </div>
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">{{ isEdit ? 'Update' : 'Create' }}</button>
      <button type="button" class="btn" @click="$emit('cancel')">Cancel</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  target: { type: Object, default: null },
  isEdit: { type: Boolean, default: false },
  targetTypes: { type: Array as PropType<(
    'WEBSITE' | 'DOMAIN' | 'SOCIAL_FOOTPRINT' | 'CLOUD_PROVIDER' | 'IP_ADDRESS' | 'CUSTOM'
  )[]>, default: () => [] }
})
const emit = defineEmits(['submit', 'cancel'])

const form = ref({
  name: '',
  type: props.targetTypes && props.targetTypes.length > 0 ? props.targetTypes[0] : 'WEBSITE',
  configString: '{}',
  metadataString: '{}'
})

watch(() => props.target, (target) => {
  if (target) {
    form.value.name = target.name || ''
    form.value.type = target.type || ''
    form.value.configString = target.config ? JSON.stringify(target.config, null, 2) : '{}'
    form.value.metadataString = target.metadata ? JSON.stringify(target.metadata, null, 2) : '{}'
  } else {
    form.value.name = ''
  form.value.type = props.targetTypes && props.targetTypes.length > 0 ? props.targetTypes[0] : 'WEBSITE'
    form.value.configString = '{}'
    form.value.metadataString = '{}'
  }
}, { immediate: true })

function onSubmit() {
  let config = {}
  let metadata = {}
  try { config = JSON.parse(form.value.configString) } catch {}
  try { metadata = JSON.parse(form.value.metadataString) } catch {}
  // Only emit if type is a valid TargetType
  if (props.targetTypes.includes(form.value.type as any)) {
    emit('submit', {
      name: form.value.name,
      type: form.value.type,
      config,
      metadata
    })
  }
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
