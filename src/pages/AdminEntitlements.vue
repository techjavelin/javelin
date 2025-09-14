<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">
        <font-awesome-icon :icon="['fas','key']" class="dashboard-svg-icon" />
        Entitlements Management
      </h1>
    </template>
    <div class="admin-page">
      <section class="catalog-section">
        <header>
          <h2>Catalog</h2>
          <button @click="loadCatalog(true)" :disabled="catLoading">Reload</button>
        </header>
        <div v-if="catalogError" class="error">{{ catalogError }}</div>
        <div v-else class="catalog-grid" v-if="!catLoading">
          <div class="catalog-block">
            <h3>Products</h3>
            <ul>
              <li v-for="p in products" :key="p.id">{{ p.key }} - {{ p.name }}</li>
            </ul>
          </div>
          <div class="catalog-block">
            <h3>Service Levels</h3>
            <ul>
              <li v-for="sl in serviceLevels" :key="sl.id">{{ sl.key }} (rank {{ sl.rank }})</li>
            </ul>
          </div>
          <div class="catalog-block">
            <h3>Features</h3>
            <ul>
              <li v-for="f in features" :key="f.id">{{ f.key }} - <small>{{ f.defaultInServiceLevels?.join(', ') }}</small></li>
            </ul>
          </div>
          <div class="catalog-block">
            <h3>Plans</h3>
            <ul>
              <li v-for="pl in plans" :key="pl.id">
                <strong>{{ pl.key }}</strong>
                <div class="mini">Features: {{ pl.featureKeys?.join(', ') }}</div>
              </li>
            </ul>
          </div>
        </div>
        <div v-if="catLoading">Loading catalog…</div>
      </section>

      <section class="org-section">
        <header>
          <h2>Organization Entitlement</h2>
          <div class="org-selector">
            <label>Organization:</label>
            <select v-model="selectedOrgId" @change="onOrgChange">
              <option value="" disabled>Select organization</option>
              <option v-for="o in organizations" :key="o.id" :value="o.id">{{ o.name }}</option>
            </select>
          </div>
        </header>
        <div v-if="orgError" class="error">{{ orgError }}</div>
        <div v-if="orgLoading">Loading entitlement…</div>
        <div v-if="currentEntitlement && !orgLoading" class="entitlement-details">
          <p><strong>Plan:</strong> {{ currentEntitlement.entitlementPlanId }}</p>
          <p><strong>Status:</strong> {{ currentEntitlement.status }}</p>
          <p><strong>Overrides Add:</strong> {{ currentEntitlement.overrides_addFeatures?.join(', ') || '—' }}</p>
          <p><strong>Overrides Remove:</strong> {{ currentEntitlement.overrides_removeFeatures?.join(', ') || '—' }}</p>
          <div class="actions">
            <label>Switch Plan:</label>
            <select v-model="switchPlanId">
              <option disabled value="">Select plan</option>
              <option v-for="pl in plans" :key="pl.id" :value="pl.id">{{ pl.key }}</option>
            </select>
            <button @click="doSwitchPlan" :disabled="!switchPlanId || switching">Switch</button>
          </div>
          <div class="override-form">
            <h3>Apply Overrides</h3>
            <input v-model="addFeatureInput" placeholder="Add feature key" @keyup.enter="addFeature" />
            <button @click="addFeature" :disabled="!addFeatureInput">Add</button>
            <input v-model="removeFeatureInput" placeholder="Remove feature key" @keyup.enter="removeFeature" />
            <button @click="removeFeature" :disabled="!removeFeatureInput">Remove</button>
          </div>
        </div>
      </section>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, onMounted, watch } from 'vue'
import { useEntitlementCatalog } from '../composables/useEntitlementCatalog'
import { useOrgEntitlements } from '../composables/useOrgEntitlements'
import { useOrganizations } from '../composables/useOrganizations'

const { products, serviceLevels, features, plans, load: loadCatalog, loading: catLoading, error: catalogError } = useEntitlementCatalog()
const { organizations, fetchOrganizations } = useOrganizations()
const { current: currentEntitlement, load: loadOrgEnt, switchPlan, applyOverrides, loading: orgLoading, updating: switching, error: orgError } = useOrgEntitlements()

const selectedOrgId = ref('')
const switchPlanId = ref('')
const addFeatureInput = ref('')
const removeFeatureInput = ref('')

async function init() {
  await Promise.all([loadCatalog(), fetchOrganizations({ force: true })])
}

function onOrgChange() {
  if (selectedOrgId.value) {
    loadOrgEnt(selectedOrgId.value, true)
  }
}

async function doSwitchPlan() {
  if (!selectedOrgId.value || !switchPlanId.value) return
  await switchPlan({ organizationId: selectedOrgId.value, entitlementPlanId: switchPlanId.value })
  await loadOrgEnt(selectedOrgId.value, true)
}

async function addFeature() {
  if (!addFeatureInput.value || !selectedOrgId.value) return
  await applyOverrides({ organizationId: selectedOrgId.value, add: [addFeatureInput.value] })
  addFeatureInput.value = ''
}

async function removeFeature() {
  if (!removeFeatureInput.value || !selectedOrgId.value) return
  await applyOverrides({ organizationId: selectedOrgId.value, remove: [removeFeatureInput.value] })
  removeFeatureInput.value = ''
}

onMounted(init)

watch(currentEntitlement, (val) => {
  if (val) {
    switchPlanId.value = ''
  }
})
</script>

<style scoped>
.admin-page { padding: 1.5rem; color: #fff; }
h1 { margin-bottom: 1rem; }
section { margin-bottom: 2rem; background:#1f2538; padding:1rem; border-radius:8px; }
header { display:flex; align-items:center; gap:1rem; justify-content:space-between; }
.catalog-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem; }
.catalog-block { background:#2d3748; padding:.75rem .9rem; border-radius:6px; }
.catalog-block h3 { margin-top:0; font-size:.95rem; letter-spacing:.5px; }
ul { list-style:none; padding:0; margin:0; max-height:240px; overflow:auto; font-size:.8rem; line-height:1.2rem; }
li { padding:2px 0; }
.mini { font-size:.65rem; opacity:.8; }
.org-selector select { background:#2d3748; color:#fff; border:1px solid #394867; padding:.4rem .6rem; border-radius:4px; }
.entitlement-details { margin-top:1rem; font-size:.85rem; }
.actions { margin-top:.75rem; display:flex; align-items:center; gap:.5rem; }
.override-form { margin-top:1rem; display:flex; flex-wrap:wrap; gap:.4rem; }
input { background:#2d3748; color:#fff; border:1px solid #394867; padding:.4rem .5rem; border-radius:4px; }
button { background:#394867; color:#fff; border:none; padding:.45rem .8rem; border-radius:4px; cursor:pointer; font-size:.75rem; }
button:disabled { opacity:.5; cursor:not-allowed; }
.error { color:#f87171; font-size:.8rem; margin-top:.5rem; }
</style>
