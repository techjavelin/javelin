<template>
  <PageWrapper title="SigInt Organizations">
    <div v-if="loading">Loading organizations...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-if="organizations.length === 0">
        <p>No organizations found.</p>
      </div>
      <CardGrid v-else>
        <Card v-for="org in organizations" :key="org.id" :title="org.name">
          <p><strong>Created:</strong> {{ org.createdAt }}</p>
          <div class="actions">
            <button class="btn" @click="viewOrg(org)">View</button>
            <button v-if="canEdit" class="btn" @click="editOrg(org)">Edit</button>
            <button v-if="canEdit" class="btn btn-danger" @click="deleteOrg(org)">Delete</button>
          </div>
        </Card>
      </CardGrid>
      <button v-if="canEdit" class="btn btn-primary" @click="showCreate = true">Add Organization</button>
    </div>
    <SigIntOrgForm
      v-if="showCreate || editingOrg"
      :org="editingOrg || undefined"
      :isEdit="!!editingOrg"
      @submit="onOrgFormSubmit"
      @cancel="onOrgFormCancel"
    />
    <div v-if="viewingOrg" class="org-detail-modal">
      <h3>{{ viewingOrg.name }}</h3>
      <p><strong>Admins:</strong> {{ viewingOrg.admins?.join(', ') }}</p>
      <p><strong>Members:</strong> {{ viewingOrg.members?.join(', ') }}</p>
      <h4>Scopes</h4>
      <div v-if="scopesLoading">Loading scopes...</div>
      <div v-else-if="scopesError" class="error">{{ scopesError }}</div>
      <div v-else>
        <ul v-if="scopes.length">
          <li v-for="scope in scopes" :key="scope.id">
            <strong>{{ scope.name }}</strong>: {{ scope.description }}
            <span v-if="canEdit">
              <button class="btn" @click="editScope(scope)">Edit</button>
              <button class="btn btn-danger" @click="deleteScope(scope)">Delete</button>
              <button class="btn btn-secondary" @click="openScopeTargets(scope)">Targets</button>
            </span>
          </li>
        </ul>
        <div v-else>No scopes found.</div>
        <button v-if="canEdit" class="btn btn-primary" @click="showScopeForm = true">Add Scope</button>
      </div>
      <SigIntScopeForm
        v-if="showScopeForm || editingScope"
        :scope="editingScope || undefined"
        :isEdit="!!editingScope"
        @submit="onScopeFormSubmit"
        @cancel="onScopeFormCancel"
      />
      <!-- Scope Targets Modal -->
      <div v-if="viewingScope" class="org-detail-modal">
        <h4>Targets for {{ viewingScope.name }}</h4>
        <div v-if="targetsLoading">Loading targets...</div>
        <div v-else-if="targetsError" class="error">{{ targetsError }}</div>
        <div v-else>
          <ul v-if="targets.length">
            <li v-for="target in targets" :key="target.id">
              <strong>{{ target.name }}</strong> ({{ target.type }})
              <span v-if="canEdit">
                <button class="btn" @click="editTarget(target)">Edit</button>
                <button class="btn btn-danger" @click="deleteTarget(target)">Delete</button>
              </span>
            </li>
          </ul>
          <div v-else>No targets found.</div>
          <button v-if="canEdit" class="btn btn-primary" @click="showTargetForm = true">Add Target</button>
        </div>
        <SigIntTargetForm
          v-if="showTargetForm || editingTarget"
          :target="editingTarget || undefined"
          :isEdit="!!editingTarget"
          :targetTypes="[...targetTypes]"
          @submit="onTargetFormSubmit"
          @cancel="onTargetFormCancel"
        />
        <button class="btn" @click="closeScopeTargets">Close</button>
      </div>
      <button class="btn" @click="closeOrgDetail">Close</button>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import PageWrapper from '@/components/PageWrapper.vue'
import CardGrid from '@/components/CardGrid.vue'
import Card from '@/components/Card.vue'
import SigIntOrgForm from '@/components/SigIntOrgForm.vue'
import SigIntScopeForm from '@/components/SigIntScopeForm.vue'
import SigIntTargetForm from '@/components/SigIntTargetForm.vue'

const client = generateClient<Schema>()
const userGroups = ref<string[]>([])
const canEdit = computed(() => userGroups.value.includes('admin') || userGroups.value.includes('pulse-sigint'))

const organizations = ref<Schema['Organization']['type'][]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const showCreate = ref(false)
const editingOrg = ref<Schema['Organization']['type'] | null>(null)
const viewingOrg = ref<Schema['Organization']['type'] | null>(null)

// Scopes state
const scopes = ref<Schema['Scope']['type'][]>([])
const scopesLoading = ref(false)
const scopesError = ref<string | null>(null)
const showScopeForm = ref(false)
const editingScope = ref<Schema['Scope']['type'] | null>(null)

// Targets modal state
const targets = ref<Schema['Target']['type'][]>([])
const targetsLoading = ref(false)
const targetsError = ref<string | null>(null)
const showTargetForm = ref(false)
const editingTarget = ref<Schema['Target']['type'] | null>(null)
const viewingScope = ref<Schema['Scope']['type'] | null>(null)
const targetTypes = [
  'WEBSITE',
  'DOMAIN',
  'SOCIAL_FOOTPRINT',
  'CLOUD_PROVIDER',
  'IP_ADDRESS',
  'CUSTOM'
] as const
type TargetType = typeof targetTypes[number]

function fetchScopesForOrg(orgId: string) {
  scopesLoading.value = true
  scopesError.value = null
  client.models.Scope.list({ filter: { organizationId: { eq: orgId } } })
    .then(({ data }) => { scopes.value = data ?? [] })
    .catch((e: any) => { scopesError.value = e.message || 'Failed to load scopes.' })
    .finally(() => { scopesLoading.value = false })
}

watch(viewingOrg, (org) => {
  if (org && org.id) fetchScopesForOrg(org.id)
  else scopes.value = []
  showScopeForm.value = false
  editingScope.value = null
})

function editScope(scope: Schema['Scope']['type']) {
  editingScope.value = { ...scope }
  showScopeForm.value = false
}

function deleteScope(scope: Schema['Scope']['type']) {
  if (confirm(`Delete scope "${scope.name}"?`)) {
    if (viewingOrg.value && viewingOrg.value.id) {
      client.models.Scope.delete({ id: scope.id }).then(() => fetchScopesForOrg(viewingOrg.value!.id))
    }
  }
}

function onScopeFormSubmit(data: Partial<Schema['Scope']['type']>) {
  if (!viewingOrg.value || !viewingOrg.value.id) return
  const name = data.name ?? ''
  const description = data.description ?? ''
  const orgId = viewingOrg.value.id
  // Default admins to org admins, members to org members
  const admins = data.admins ?? viewingOrg.value.admins ?? []
  const members = data.members ?? viewingOrg.value.members ?? []
  if (editingScope.value) {
    client.models.Scope.update({ id: editingScope.value.id, name, description, organizationId: orgId, admins, members, ...data })
      .then(() => {
        editingScope.value = null
        fetchScopesForOrg(orgId)
      })
  } else {
    client.models.Scope.create({ name, description, organizationId: orgId, admins, members, ...data })
      .then(() => {
        showScopeForm.value = false
        fetchScopesForOrg(orgId)
      })
  }
}

function onScopeFormCancel() {
  editingScope.value = null
  showScopeForm.value = false
}

function openScopeTargets(scope: Schema['Scope']['type']) {
  viewingScope.value = scope
  fetchTargetsForScope(scope.id)
  showTargetForm.value = false
  editingTarget.value = null
}

function closeScopeTargets() {
  viewingScope.value = null
  targets.value = []
  showTargetForm.value = false
  editingTarget.value = null
}

function fetchTargetsForScope(scopeId: string) {
  targetsLoading.value = true
  targetsError.value = null
  client.models.Target.list({ filter: { scopeId: { eq: scopeId } } })
    .then(({ data }) => { targets.value = data ?? [] })
    .catch((e: any) => { targetsError.value = e.message || 'Failed to load targets.' })
    .finally(() => { targetsLoading.value = false })
}

function editTarget(target: Schema['Target']['type']) {
  editingTarget.value = { ...target }
  showTargetForm.value = false
}

function deleteTarget(target: Schema['Target']['type']) {
  if (confirm(`Delete target "${target.name}"?`)) {
    if (viewingScope.value && viewingScope.value.id) {
      client.models.Target.delete({ id: target.id }).then(() => fetchTargetsForScope(viewingScope.value!.id))
    }
  }
}

function onTargetFormSubmit(data: Partial<Schema['Target']['type']>) {
  if (!viewingScope.value || !viewingScope.value.id || !viewingOrg.value || !viewingOrg.value.id) return
  const name = data.name ?? ''
  const type: TargetType = (data.type && targetTypes.includes(data.type as TargetType)) ? data.type as TargetType : targetTypes[0]
  const config = data.config ?? {}
  const metadata = data.metadata ?? {}
  const scopeId = viewingScope.value.id
  const organizationId = viewingOrg.value.id
  // Default admins/members to scope/organization admins/members
  const admins = data.admins ?? viewingScope.value.admins ?? viewingOrg.value.admins ?? []
  const members = data.members ?? viewingScope.value.members ?? viewingOrg.value.members ?? []
  if (editingTarget.value) {
    client.models.Target.update({ id: editingTarget.value.id, name, type, config, metadata, scopeId, organizationId, admins, members, ...data })
      .then(() => {
        editingTarget.value = null
        fetchTargetsForScope(scopeId)
      })
  } else {
    client.models.Target.create({ name, type, config, metadata, scopeId, organizationId, admins, members, ...data })
      .then(() => {
        showTargetForm.value = false
        fetchTargetsForScope(scopeId)
      })
  }
}

function onTargetFormCancel() {
  editingTarget.value = null
  showTargetForm.value = false
}

function closeOrgDetail() {
  viewingOrg.value = null
  scopes.value = []
  showScopeForm.value = false
  editingScope.value = null
}

async function fetchOrganizations() {
  loading.value = true
  error.value = null
  try {
    console.log('[SigInt] Fetching organizations...')
    const { data } = await client.models.Organization.list({})
    console.log('[SigInt] Organizations fetched:', data)
    organizations.value = data ?? []
  } catch (e: any) {
    error.value = e.message || 'Failed to load organizations.'
    console.error('[SigInt] Error fetching organizations:', e)
  } finally {
    loading.value = false
    console.log('[SigInt] Loading state:', loading.value, 'Organizations:', organizations.value)
  }
}

async function getUserGroups() {
  try {
    const { getCurrentUser } = await import('aws-amplify/auth')
    const user = await getCurrentUser()
    console.log('[SigInt] Current user:', user)
    // Log Cognito userId (sub) for debugging
    if (user && user.userId) {
      console.log('[SigInt] Cognito userId (sub):', user.userId)
    } else {
      console.warn('[SigInt] No Cognito userId found on user object')
    }
    const payload = (user as any)?.signInDetails?.tokenPayload || {}
    console.log('[SigInt] User token payload:', payload)
    let groups = payload['cognito:groups'] || payload['groups'] || []
    if (typeof groups === 'string') groups = [groups]
    userGroups.value = Array.isArray(groups) ? groups : []
    console.log('[SigInt] Extracted user groups:', userGroups.value)
  } catch (e) {
    console.error('[SigInt] Error getting user groups:', e)
    userGroups.value = []
  }
}

onMounted(() => {
  console.log('[SigInt] onMounted: fetching organizations and user groups...')
  fetchOrganizations()
  getUserGroups()
})

watch(userGroups, (groups) => {
  console.log('[SigInt] User groups changed:', groups)
})

function viewOrg(org: Schema['Organization']['type']) {
  viewingOrg.value = org
}

function editOrg(org: Schema['Organization']['type']) {
  editingOrg.value = { ...org }
  showCreate.value = false
}

function deleteOrg(org: Schema['Organization']['type']) {
  if (confirm(`Delete organization "${org.name}"?`)) {
    client.models.Organization.delete({ id: org.id }).then(fetchOrganizations)
  }
}

function onOrgFormSubmit(data: Partial<Schema['Organization']['type']>) {
  // Always provide required fields
  const name = data.name ?? ''
  // Default admins to current user if possible, else empty array
  const admins = data.admins ?? userGroups.value.length ? userGroups.value : []
  if (editingOrg.value) {
    client.models.Organization.update({ id: editingOrg.value.id, name, admins, ...data }).then(() => {
      editingOrg.value = null
      fetchOrganizations()
    })
  } else {
    client.models.Organization.create({ name, admins, ...data }).then(() => {
      showCreate.value = false
      fetchOrganizations()
    })
  }
}

function onOrgFormCancel() {
  editingOrg.value = null
  showCreate.value = false
}
</script>

<style scoped>
.btn {
  margin-top: 1rem;
}
.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.btn-danger {
  background: #e53935;
  color: #fff;
}
.error {
  color: #e53935;
  margin: 1rem 0;
}
.org-detail-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.18);
  padding: 2rem;
  z-index: 1000;
  min-width: 320px;
}
</style>
