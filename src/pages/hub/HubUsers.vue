<template>
  <DashboardLayout hideSidebarPadding>
    <template #sidebar><HubSidebar /></template>
    <div class="hub-page">
      <div class="head-row">
        <h1 class="page-title">Users</h1>
        <div class="org-select" v-if="organizations.length || orgsLoading">
          <select v-model="selectedOrgId" :disabled="orgsLoading">
            <option v-if="orgsLoading" value="">Loading…</option>
            <option v-for="o in organizations" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </div>
      </div>
      <div v-if="loading" class="loading">Loading users…</div>
      <div v-else-if="error" class="error-box"><p class="err-msg">{{ error }}</p><button class="retry" @click="reload">Retry</button></div>
      <div v-else>
        <table v-if="memberships.length" class="user-table">
          <thead><tr><th>User</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>
            <tr v-for="m in memberships" :key="m.organizationId + ':' + m.userId">
              <td>{{ m.userId }}</td>
              <td><span class="badge role">{{ m.role }}</span></td>
              <td>{{ formatDate(m.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty">No members for this organization.</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import HubSidebar from '@/components/hub/HubSidebar.vue'
import { ref, watch, onMounted } from 'vue'
import { useCurrentOrg } from '@/composables/useCurrentOrg'
import { useHubOrgUsers } from '@/composables/useHubOrgUsers'

const { memberships, loading, error, listByOrg } = useHubOrgUsers()
const { currentOrgId, organizations, orgsLoading, setCurrentOrg } = useCurrentOrg()
const selectedOrgId = ref<string | null>(currentOrgId.value)

watch(selectedOrgId, id=>{ setCurrentOrg(id); reload() })
watch(currentOrgId, id=>{ if (id && selectedOrgId.value !== id) selectedOrgId.value = id })

function reload(){ listByOrg(selectedOrgId.value || undefined) }
function formatDate(d?: string | null){ if (!d) return '-'; return new Date(d).toLocaleDateString() }
onMounted(()=> reload())
</script>

<style scoped>
.hub-page { padding:1.25rem 1.4rem 2rem; display:flex; flex-direction:column; gap:1rem; }
.head-row { display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; }
select { background:#1e293b; border:1px solid rgba(255,255,255,0.12); color:#fff; font-size:.6rem; padding:.4rem .55rem; border-radius:6px; }
.user-table { width:100%; border-collapse:collapse; font-size:.6rem; }
.user-table th, .user-table td { text-align:left; padding:.5rem .6rem; border-bottom:1px solid rgba(255,255,255,0.08); }
.badge.role { background:#334155; padding:.2rem .5rem; border-radius:999px; font-size:.5rem; letter-spacing:.05em; }
.empty { font-size:.65rem; opacity:.6; }
.loading { font-size:.7rem; opacity:.7; }
.error-box { background:#3f1f23; border:1px solid #7f2f37; padding:.6rem .75rem; border-radius:8px; }
.err-msg { margin:0 0 .4rem; font-size:.6rem; }
.retry { background:#7f2f37; border:none; color:#fff; font-size:.55rem; padding:.35rem .6rem; border-radius:6px; cursor:pointer; }
</style>
