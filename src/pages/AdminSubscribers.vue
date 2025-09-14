<template>
  <DashboardLayout>
    <template #header>
      <div class="header-row">
        <h1 class="dashboard-title">
          <font-awesome-icon :icon="['fas', 'user-check']" class="dashboard-svg-icon" />
          Subscribers
        </h1>
        <div class="header-actions">
          <button class="btn" @click="refresh" :disabled="loading">Refresh</button>
          <button class="btn" @click="exportCsv" :disabled="!subscribers.length">Export CSV</button>
          <button class="btn primary" @click="showAdd = true">Add</button>
        </div>
      </div>
    </template>
    <section class="admin-subscribers-section">
      <div class="metrics" v-if="metrics">
        <div class="metric">
          <span class="label">Active</span>
          <span class="value">{{ metrics.active }}</span>
        </div>
        <div class="metric">
          <span class="label">Pending</span>
          <span class="value">{{ metrics.pending }}</span>
        </div>
        <div class="metric">
          <span class="label">Unsubscribed</span>
          <span class="value">{{ metrics.unsubscribed }}</span>
        </div>
        <div class="metric">
          <span class="label">New (7d)</span>
          <span class="value">{{ metrics.new7d }}</span>
        </div>
      </div>
      <div class="toolbar">
        <input v-model="query" placeholder="Search email or name" class="search" />
        <select v-model="filterStatus" class="filter">
          <option value="all">All</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <select v-model.number="pageSize" class="filter">
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <button class="btn" @click="loadMore" :disabled="!hasMore() || loading">Load More</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="loading" class="loading">Loading...</div>
      <table v-if="!loading && filtered.length" class="subscribers-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Status</th>
            <th>Frequency</th>
            <th>Topics</th>
            <th>Subscribed</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s.id">
            <td>{{ s.email }}</td>
            <td>{{ s.name || '—' }}</td>
            <td>
              <span :class="['badge', s.isSubscribed ? 'badge-green':'badge-gray']">{{ s.isSubscribed ? 'Active':'Inactive' }}</span>
            </td>
            <td>{{ s.frequency || '—' }}</td>
            <td class="topics">{{ (s.topics || []).join(', ') || '—' }}</td>
            <td>{{ s.subscribedAt ? formatDate(s.subscribedAt): '—' }}</td>
            <td class="row-actions">
              <button class="btn-sm" @click="toggleSubscription(s)">{{ s.isSubscribed ? 'Unsubscribe':'Resubscribe' }}</button>
              <button class="btn-sm danger" @click="remove(s)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else-if="!loading && !filtered.length" class="empty-state">No subscribers found.</div>
    </section>

    <div v-if="showAdd" class="modal-backdrop" @click.self="showAdd=false">
      <div class="modal">
        <h2>Add Subscriber</h2>
        <form @submit.prevent="add">
          <label>Email
            <input v-model="form.email" type="email" required />
          </label>
          <label>Name
            <input v-model="form.name" type="text" />
          </label>
          <label>Frequency
            <select v-model="form.frequency">
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </label>
          <label>Topics (comma separated)
            <input v-model="topicsInput" type="text" placeholder="security, product" />
          </label>
          <div class="modal-actions">
            <button type="button" class="btn" @click="showAdd=false">Cancel</button>
            <button type="submit" class="btn primary" :disabled="loading">Add</button>
          </div>
        </form>
      </div>
    </div>
  </DashboardLayout>
</template>
<script setup>
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useNewsletter } from '../composables/blog/useNewsletter'

const { subscribers, fetchSubscribers, loading, error, subscribe, toggleSubscription, removeSubscriber, exportCsv, hasMore, loadMore, pageSize } = useNewsletter()
const metrics = ref(null)
const query = ref('')
const filterStatus = ref('all')
const showAdd = ref(false)
const topicsInput = ref('')
const form = reactive({ email: '', name: '', frequency: 'WEEKLY' })

const filtered = computed(() => {
  const q = query.value.toLowerCase().trim()
  return subscribers.value.filter(s => {
    if (filterStatus.value === 'subscribed' && !s.isSubscribed) return false
    if (filterStatus.value === 'unsubscribed' && s.isSubscribed) return false
    if (!q) return true
    return s.email.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q)
  })
})

function formatDate(dt) {
  try { return new Date(dt).toLocaleDateString() } catch { return dt }
}

async function refresh() { await fetchSubscribers({ force: true }) }

async function add() {
  const topics = topicsInput.value.split(',').map(t => t.trim()).filter(Boolean)
  const ok = await subscribe(form.email, form.name, form.frequency, topics)
  if (ok) {
    form.email=''; form.name=''; topicsInput.value=''; showAdd.value=false
  }
}

async function toggleSubscriptionWrapped(s) {
  await toggleSubscription(s.id, s.isSubscribed)
}

async function remove(s) {
  if (!confirm('Delete subscriber?')) return
  await removeSubscriber(s.id)
}

function computeMetrics() {
  const list = subscribers.value
  const now = Date.now()
  const sevenDays = now - 1000*60*60*24*7
  const active = list.filter(s => s.status === 'ACTIVE').length
  const pending = list.filter(s => s.status === 'PENDING').length
  const unsubscribed = list.filter(s => s.status === 'UNSUBSCRIBED').length
  const new7d = list.filter(s => s.subscribedAt && new Date(s.subscribedAt).getTime() >= sevenDays).length
  metrics.value = { active, pending, unsubscribed, new7d }
}

onMounted(async () => { await fetchSubscribers(); computeMetrics() })
watch(subscribers, () => computeMetrics(), { deep: true })

function toggleSubscription(s) { toggleSubscriptionWrapped(s) }
</script>
<style scoped>
.header-row { display:flex; justify-content:space-between; align-items:center; }
.header-actions { display:flex; gap:.5rem; }
.admin-subscribers-section { padding: 1.5rem; background:#181e2a; border-radius:12px; min-height:400px; }
.dashboard-title { font-size:2rem; font-weight:700; color:#fff; margin:0; display:flex; align-items:center; gap:.75rem; }
.dashboard-svg-icon { font-size:1.5rem; color:#60a5fa; }
.toolbar { display:flex; gap:.75rem; margin-bottom:1rem; }
.search { flex:1; padding:.5rem .75rem; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#e2e8f0; }
.filter { padding:.5rem; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#e2e8f0; }
table.subscribers-table { width:100%; border-collapse:collapse; font-size:.85rem; }
table.subscribers-table th, table.subscribers-table td { padding:.5rem .75rem; border-bottom:1px solid #1e293b; text-align:left; }
table.subscribers-table th { background:#0f172a; position:sticky; top:0; z-index:1; }
.badge { padding:.25rem .5rem; border-radius:12px; font-size:.65rem; text-transform:uppercase; letter-spacing:.05em; }
.badge-green { background:#065f46; color:#d1fae5; }
.badge-gray { background:#334155; color:#cbd5e1; }
.row-actions { display:flex; gap:.5rem; }
.btn, .btn-sm { background:#1e293b; color:#e2e8f0; border:1px solid #334155; border-radius:6px; cursor:pointer; padding:.5rem .9rem; font-size:.75rem; display:inline-flex; align-items:center; gap:.4rem; }
.btn-sm { padding:.35rem .6rem; }
.btn.primary { background:#2563eb; border-color:#2563eb; }
.btn.primary:disabled { opacity:.6; }
.btn:hover:not(:disabled) { background:#334155; }
.btn.primary:hover:not(:disabled) { background:#1d4ed8; }
.btn.danger { background:#7f1d1d; border-color:#7f1d1d; }
.btn.danger:hover { background:#991b1b; }
.empty-state { padding:2rem; text-align:center; color:#64748b; }
.loading { padding:1rem; color:#94a3b8; }
.error { padding:.75rem 1rem; background:#7f1d1d; color:#fee2e2; border-radius:8px; margin-bottom:1rem; }
.modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:flex-start; justify-content:center; padding-top:10vh; }
.modal { background:#0f172a; padding:1.5rem 1.75rem; border-radius:12px; width:420px; max-width:90%; box-shadow:0 10px 30px -5px rgba(0,0,0,.4); }
.modal h2 { margin:0 0 1rem; font-size:1.25rem; color:#fff; }
.modal form { display:flex; flex-direction:column; gap:.85rem; }
.modal label { display:flex; flex-direction:column; gap:.35rem; font-size:.75rem; text-transform:uppercase; letter-spacing:.05em; color:#94a3b8; }
.modal input, .modal select { padding:.6rem .7rem; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#e2e8f0; }
.modal-actions { display:flex; justify-content:flex-end; gap:.5rem; margin-top:.25rem; }
.topics { max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
</style>
