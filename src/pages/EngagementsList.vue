<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useEngagements } from '@/composables/useEngagements'
import { useAuthorization } from '@/composables/useAuthorization'
import CapGate from '@/components/CapGate.vue'
import { usePagination } from '@/composables/usePagination'

const { items, list, loading, error } = useEngagements()
const { nextToken, update: updateToken, itemsPerPage, reset } = usePagination(10)
const { has } = useAuthorization()
const canCreate = computed(() => has('APP.CREATE_ENGAGEMENT')) // kept for possible logic reuse; UI uses CapGate

const showCreate = ref(false)
const newTitle = ref('')
const creating = ref(false)

async function load(initial = false) {
  if (initial) reset()
  const resp = await list({ limit: itemsPerPage.value, nextToken: initial ? undefined : nextToken.value || undefined })
  updateToken(resp.nextToken)
}

async function loadMore() {
  if (!nextToken.value) return
  const resp = await list({ limit: itemsPerPage.value, nextToken: nextToken.value })
  updateToken(resp.nextToken)
}

async function create() {
  // Placeholder: creation will be implemented once secure mutation / required fields defined
  creating.value = true
  try {
    // no-op now
    showCreate.value = false
    newTitle.value = ''
  } finally { creating.value = false }
}

onMounted(() => load(true))
</script>

<template>
  <div class="engagements-list">
    <header class="list-header">
      <h1>Pentest Engagements</h1>
      <CapGate capability="APP.CREATE_ENGAGEMENT">
        <button class="create-btn" type="button">New Engagement</button>
      </CapGate>
    </header>
    <div v-if="loading" class="state">Loading…</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <div v-else>
  <table v-if="items && items.length" class="eng-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Phase</th>
            <th>Status</th>
            <th>Start</th>
            <th>End</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in (items || [])" :key="e.id">
            <td>
              <RouterLink :to="`/engagements/${e.id}`">{{ e.title || e.id }}</RouterLink>
            </td>
            <td>{{ e.phase || '—' }}</td>
            <td>{{ e.status || '—' }}</td>
            <td>{{ e.startDate ? new Date(e.startDate).toLocaleDateString() : '—' }}</td>
            <td>{{ e.endDate ? new Date(e.endDate).toLocaleDateString() : '—' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="state empty">No engagements yet.</div>
    </div>

    <div v-if="items && items.length && nextToken" class="load-more-row">
      <button class="load-more" @click="loadMore">Load More</button>
    </div>

    <div v-if="showCreate" class="modal-backdrop">
      <div class="modal">
        <h2>New Engagement (placeholder)</h2>
        <label>Title
          <input v-model="newTitle" type="text" />
        </label>
        <div class="actions">
          <button @click="showCreate=false">Cancel</button>
          <button :disabled="creating || !newTitle" @click="create">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.create-btn { background: var(--color-accent,#3b82f6); color: #fff; border: none; padding: 0.5rem 0.9rem; border-radius: 4px; cursor: pointer; }
.create-btn:hover { opacity: .9; }
.eng-table { width: 100%; border-collapse: collapse; }
.eng-table th, .eng-table td { text-align: left; padding: 0.5rem 0.6rem; border-bottom: 1px solid #ddd; }
.state { padding: 1rem; font-size: 0.95rem; }
.state.error { color: #b91c1c; }
.state.empty { color: #555; }
.modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; }
.modal { background:#fff; padding:1rem 1.2rem; border-radius:6px; width:320px; display:flex; flex-direction:column; gap:.75rem; }
.modal input { width:100%; padding:0.4rem; }
.modal .actions { display:flex; justify-content:flex-end; gap:.5rem; }
.load-more-row { margin-top:1rem; text-align:center; }
.load-more { background:#334155; color:#fff; border:none; padding:.55rem 1rem; border-radius:4px; cursor:pointer; }
.load-more:hover { background:#475569; }
</style>