<template>
  <div class="user-management">
    <!-- Header with Actions -->
    <div class="user-management-header">
  <h2><font-awesome-icon :icon="faEditIcon" class="user-header-svg" /> User Management</h2>
      <div class="header-actions">
        <button @click="showInviteModal = true" class="btn btn-primary">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          Invite User
        </button>
        <button @click="refreshUsers" class="btn btn-secondary" :disabled="loading">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="user-filters">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
        </svg>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search users..." 
          class="search-input"
        />
      </div>
      <div class="filter-tabs">
        <button 
          v-for="status in userStatuses" 
          :key="status.value"
          @click="selectedStatus = status.value"
          :class="['filter-tab', { active: selectedStatus === status.value }]"
        >
          {{ status.label }}
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="users-table-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading users...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="refreshUsers" class="btn btn-secondary">Try Again</button>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="empty-state">
  <div class="empty-icon"><font-awesome-icon :icon="faEditIcon" class="empty-svg-icon" /></div>
        <h3>No users found</h3>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Get started by inviting your first user</p>
        <button @click="showInviteModal = true" class="btn btn-primary">
          Invite User
        </button>
      </div>

      <div v-else class="users-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Status</th>
              <th>Created</th>
              <th>Last Sign In</th>
              <th>Groups</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user.username || user.Username" class="user-row">
              <td class="user-info">
                <div class="user-avatar">
                  {{ getUserInitials(user) }}
                </div>
                <div class="user-details">
                  <div class="user-name">{{ getUserDisplayName(user) }}</div>
                  <div class="user-id">{{ user.username || user.Username }}</div>
                </div>
              </td>
              <td class="user-email">
                {{ getUserEmail(user) }}
              </td>
              <td class="user-status">
                <span :class="['status-badge', getUserStatusClass(user.userStatus)]">
                  {{ formatUserStatus(user.userStatus) }}
                </span>
              </td>
              <td class="user-created">
                {{ formatDate(user.userCreateDate || user.UserCreateDate) }}
              </td>
              <td class="user-last-signin">
                {{ (user.userLastModifiedDate || user.UserLastModifiedDate) ? formatDate(user.userLastModifiedDate || user.UserLastModifiedDate) : 'Never' }}
              </td>
              <td class="user-groups">
                <div class="groups-container">
                  <span 
                    v-for="group in getUserGroups(user)" 
                    :key="group"
                    :class="['group-badge', group.toLowerCase()]"
                  >
                    {{ group }}
                  </span>
                  <span v-if="getUserGroups(user).length === 0" class="no-groups">
                    No groups
                  </span>
                </div>
              </td>
              <td class="user-actions">
                <div class="action-buttons">
                  <button 
                    @click="editUser(user)" 
                    class="action-btn edit"
                    title="Edit User"
                  >
                    <font-awesome-icon :icon="faEditIcon" />
                  </button>
                  <button 
                    @click="resetUserPassword(user)" 
                    class="action-btn reset"
                    title="Reset Password"
                  >
                    <font-awesome-icon :icon="faResetIcon" />
                  </button>
                  <button 
                    @click="confirmDeleteUser(user)" 
                    class="action-btn delete"
                    title="Delete User"
                    :disabled="(user.username || user.Username) === currentUser?.username"
                  >
                    <font-awesome-icon :icon="faDeleteIcon" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="currentPage = 1" 
        :disabled="currentPage === 1"
        class="page-btn"
      >
        First
      </button>
      <button 
        @click="currentPage--" 
        :disabled="currentPage === 1"
        class="page-btn"
      >
        Previous
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button 
        @click="currentPage++" 
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        Next
      </button>
      <button 
        @click="currentPage = totalPages" 
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        Last
      </button>
    </div>

    <!-- Invite User Modal -->
    <div v-if="showInviteModal" class="modal-overlay" @click.self="showInviteModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Invite New User</h3>
          <button @click="showInviteModal = false" class="close-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="inviteUser" class="invite-form">
          <div class="form-group">
            <label for="inviteEmail">Email Address</label>
            <input 
              id="inviteEmail"
              v-model="inviteForm.email" 
              type="email" 
              required 
              placeholder="user@example.com"
              :disabled="inviting"
            />
          </div>
          
          <div class="form-group">
            <label for="givenName">First Name (optional)</label>
            <input 
              id="givenName"
              v-model="inviteForm.givenName" 
              type="text" 
              placeholder="John"
              :disabled="inviting"
            />
          </div>
          
          <div class="form-group">
            <label for="familyName">Last Name (optional)</label>
            <input 
              id="familyName"
              v-model="inviteForm.familyName" 
              type="text" 
              placeholder="Doe"
              :disabled="inviting"
            />
          </div>
          
          <div class="form-group">
            <label for="inviteGroups">User Groups (optional)</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  value="admin" 
                  v-model="inviteForm.groups"
                  :disabled="inviting"
                />
                Admin
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  value="editor" 
                  v-model="inviteForm.groups"
                  :disabled="inviting"
                />
                Editor
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  value="author" 
                  v-model="inviteForm.groups"
                  :disabled="inviting"
                />
                Author
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="temporaryPassword">Temporary Password (optional)</label>
            <input 
              id="temporaryPassword"
              v-model="inviteForm.temporaryPassword" 
              type="password"
              placeholder="Leave blank for auto-generated"
              :disabled="inviting"
            />
            <small class="form-help">If blank, a secure password will be auto-generated</small>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="inviteForm.sendWelcomeEmail"
                :disabled="inviting"
              />
              Send welcome email to user
            </label>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="showInviteModal = false" class="btn btn-secondary" :disabled="inviting">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="inviting || !inviteForm.email">
              <div v-if="inviting" class="loading-spinner small"></div>
              {{ inviting ? 'Sending...' : 'Send Invitation' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit User: {{ getUserDisplayName(editingUser) }}</h3>
          <button @click="showEditModal = false" class="close-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="updateUser" class="edit-form">
          <div class="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              :value="getUserEmail(editingUser)" 
              readonly 
              class="readonly-input"
            />
            <small>Email cannot be changed after account creation</small>
          </div>
          
          <div class="form-group">
            <label for="editGivenName">First Name</label>
            <input 
              id="editGivenName"
              v-model="editForm.givenName" 
              type="text" 
              placeholder="John"
              :disabled="updating"
            />
          </div>
          
          <div class="form-group">
            <label for="editFamilyName">Last Name</label>
            <input 
              id="editFamilyName"
              v-model="editForm.familyName" 
              type="text" 
              placeholder="Doe"
              :disabled="updating"
            />
          </div>
          
          <div class="form-group">
            <label for="editGroups">User Groups</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  value="admin" 
                  v-model="editForm.groups"
                  :disabled="updating"
                />
                Admin
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  value="editor" 
                  v-model="editForm.groups"
                  :disabled="updating"
                />
                Editor
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  value="author" 
                  v-model="editForm.groups"
                  :disabled="updating"
                />
                Author
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="userStatus">Account Status</label>
            <select 
              id="userStatus"
              v-model="editForm.enabled" 
              :disabled="updating || (editingUser?.username || editingUser?.Username) === currentUser?.username"
            >
              <option :value="true">Enabled</option>
              <option :value="false">Disabled</option>
            </select>
            <small v-if="(editingUser?.username || editingUser?.Username) === currentUser?.username">
              You cannot disable your own account
            </small>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="showEditModal = false" class="btn btn-secondary" :disabled="updating">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="updating">
              <div v-if="updating" class="loading-spinner small"></div>
              {{ updating ? 'Updating...' : 'Update User' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content danger">
        <div class="modal-header">
          <h3>⚠️ Delete User</h3>
          <button @click="showDeleteModal = false" class="close-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ getUserDisplayName(deletingUser) }}</strong>?</p>
          <p class="warning-text">This action cannot be undone. The user will lose access to their account and all associated data.</p>
          
          <div class="confirmation-input">
            <label for="deleteConfirmation">Type "DELETE" to confirm:</label>
            <input 
              id="deleteConfirmation"
              v-model="deleteConfirmation" 
              type="text" 
              placeholder="DELETE"
              :disabled="deleting"
            />
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" @click="showDeleteModal = false" class="btn btn-secondary" :disabled="deleting">
            Cancel
          </button>
          <button 
            @click="deleteUser" 
            class="btn btn-danger" 
            :disabled="deleting || deleteConfirmation !== 'DELETE'"
          >
            <div v-if="deleting" class="loading-spinner small"></div>
            {{ deleting ? 'Deleting...' : 'Delete User' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { faUserEdit, faRedo, faTrash } from '@fortawesome/free-solid-svg-icons'
const faEditIcon = { prefix: faUserEdit.prefix, iconName: faUserEdit.iconName }
const faResetIcon = { prefix: faRedo.prefix, iconName: faRedo.iconName }
const faDeleteIcon = { prefix: faTrash.prefix, iconName: faTrash.iconName }
import { ref, computed, onMounted, watch } from 'vue'
import { getCurrentUser } from 'aws-amplify/auth'
import { 
  userManagementService,
  getUserDisplayName,
  getUserEmail,
  formatUserStatus,
  getUserStatusClass,
  getUserAttribute
} from '../services/userManagementService'

// Reactive data
const loading = ref(false)
const error = ref('')
const users = ref([])
const currentUser = ref(null)
const searchQuery = ref('')
const selectedStatus = ref('all')
const currentPage = ref(1)
const pageSize = 25

// Modals
const showInviteModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)

// Form states
const inviting = ref(false)
const updating = ref(false)
const deleting = ref(false)

// Form data
const inviteForm = ref({
  email: '',
  givenName: '',
  familyName: '',
  groups: [],
  temporaryPassword: '',
  sendWelcomeEmail: true
})

const editForm = ref({
  givenName: '',
  familyName: '',
  groups: [],
  enabled: true
})

const editingUser = ref(null)
const deletingUser = ref(null)
const deleteConfirmation = ref('')

// Constants
const userStatuses = [
  { label: 'All Users', value: 'all' },
  { label: 'Enabled', value: 'enabled' },
  { label: 'Disabled', value: 'disabled' },
  { label: 'Unconfirmed', value: 'unconfirmed' }
]

// Computed properties
const filteredUsers = computed(() => {
  let filtered = users.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => {
      const email = getUserEmail(user).toLowerCase()
      const name = getUserDisplayName(user).toLowerCase()
      const username = (user.username || '').toLowerCase()
      return email.includes(query) || name.includes(query) || username.includes(query)
    })
  }

  // Filter by status
  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter(user => {
      const status = getUserStatus(user).toLowerCase()
      return status === selectedStatus.value
    })
  }

  return filtered
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredUsers.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / pageSize)
})

// Helper functions
// Removed local getUserStatus in favor of shared service helpers (formatUserStatus / getUserStatusClass)

function getUserGroups(user) {
  return user.groups || []
}

function getUserInitials(user) {
  const name = getUserDisplayName(user)
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// API functions
async function loadUsers() {
  loading.value = true
  error.value = ''

  try {
    const response = await userManagementService.listUsers(60)
    users.value = response.users || []
  } catch (err) {
    console.error('Error loading users:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load users. Please check your permissions.'
  } finally {
    loading.value = false
  }
}

async function inviteUser() {
  if (!inviteForm.value.email || inviting.value) return

  inviting.value = true

  try {
    await userManagementService.createUser({
      email: inviteForm.value.email,
      givenName: inviteForm.value.givenName,
      familyName: inviteForm.value.familyName,
      groups: inviteForm.value.groups,
      temporaryPassword: inviteForm.value.temporaryPassword,
      sendWelcomeEmail: inviteForm.value.sendWelcomeEmail
    })

    // Reset form and close modal
    inviteForm.value = { 
      email: '', 
      givenName: '',
      familyName: '',
      groups: [], 
      temporaryPassword: '',
      sendWelcomeEmail: true 
    }
    showInviteModal.value = false
    
    // Reload users
    await loadUsers()

    alert('User invitation sent successfully!')
  } catch (err) {
    console.error('Error inviting user:', err)
    alert(err instanceof Error ? err.message : 'Failed to send invitation. Please try again.')
  } finally {
    inviting.value = false
  }
}

async function editUser(user) {
  editingUser.value = user
  editForm.value = {
    givenName: getUserAttribute(user, 'given_name'),
    familyName: getUserAttribute(user, 'family_name'),
    groups: [...(user.groups || user.Groups || [])],
    enabled: user.enabled !== false && user.Enabled !== false
  }
  showEditModal.value = true
}

async function updateUser() {
  if (!editingUser.value || updating.value) return

  updating.value = true

  try {
    await userManagementService.updateUser(editingUser.value.username || editingUser.value.Username, {
      givenName: editForm.value.givenName,
      familyName: editForm.value.familyName,
      enabled: editForm.value.enabled,
      groups: editForm.value.groups
    })

    showEditModal.value = false
    await loadUsers()

    alert('User updated successfully!')
  } catch (err) {
    console.error('Error updating user:', err)
    alert(err instanceof Error ? err.message : 'Failed to update user. Please try again.')
  } finally {
    updating.value = false
  }
}

async function resetUserPassword(user) {
  if (!confirm(`Reset password for ${getUserDisplayName(user)}? They will receive an email with a temporary password.`)) {
    return
  }

  try {
    const response = await userManagementService.resetUserPassword(user.username || user.Username)
    alert(`Password reset successfully! Temporary password: ${response.temporaryPassword}\n\n${response.note}`)
  } catch (err) {
    console.error('Error resetting password:', err)
    alert(err instanceof Error ? err.message : 'Failed to reset password. Please try again.')
  }
}

function confirmDeleteUser(user) {
  deletingUser.value = user
  deleteConfirmation.value = ''
  showDeleteModal.value = true
}

async function deleteUser() {
  if (!deletingUser.value || deleting.value || deleteConfirmation.value !== 'DELETE') return

  deleting.value = true

  try {
    await userManagementService.deleteUser(deletingUser.value.username || deletingUser.value.Username)
    showDeleteModal.value = false
    await loadUsers()
    alert('User deleted successfully!')
  } catch (err) {
    console.error('Error deleting user:', err)
    alert(err instanceof Error ? err.message : 'Failed to delete user. Please try again.')
  } finally {
    deleting.value = false
  }
}

async function refreshUsers() {
  await loadUsers()
}

// Watch for search/filter changes and reset pagination
watch([searchQuery, selectedStatus], () => {
  currentPage.value = 1
})

// Load data on mount
onMounted(async () => {
  try {
    currentUser.value = await getCurrentUser()
  } catch (err) {
    console.error('Error getting current user:', err)
  }
  
  await loadUsers()
})
</script>

<style scoped>
/* Component base styles */
.user-management {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Header */
.user-management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.user-management-header h2 {
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  width: 16px;
  height: 16px;
}

/* Filters */
.user-filters {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-tabs {
  display: flex;
  gap: 0.25rem;
}

.filter-tab {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.filter-tab:hover {
  background: #f3f4f6;
}

.filter-tab.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Table */
.users-table-container {
  min-height: 400px;
  padding: 1.5rem;
}

.users-table {
  overflow-x: auto;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.users-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  position: sticky;
  top: 0;
}

.user-row:hover {
  background: #f8fafc;
}

/* User info cell */
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-details {
  min-width: 0;
}

.user-name {
  font-weight: 500;
  color: #111827;
}

.user-id {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.enabled {
  background: #dcfce7;
  color: #166534;
}

.status-badge.disabled {
  background: #fef2f2;
  color: #991b1b;
}

.status-badge.unconfirmed {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-pending {
  background: #e0f2fe;
  color: #0369a1;
}

.status-badge.status-archived {
  background: #e5e7eb;
  color: #374151;
}

.status-badge.status-unknown {
  background: #f3f4f6;
  color: #6b7280;
}

/* Groups */
.groups-container {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.group-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.group-badge.admin {
  background: #ddd6fe;
  color: #5b21b6;
}

.group-badge.editor {
  background: #dcfce7;
  color: #166534;
}

.group-badge.author {
  background: #fef3c7;
  color: #92400e;
}

.no-groups {
  color: #6b7280;
  font-size: 0.75rem;
  font-style: italic;
}

/* Action buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn.edit {
  background: #dbeafe;
  color: #1d4ed8;
}

.action-btn.edit:hover {
  background: #3b82f6;
  color: white;
}

.action-btn.reset {
  background: #fef3c7;
  color: #d97706;
}

.action-btn.reset:hover {
  background: #f59e0b;
  color: white;
}

.action-btn.delete {
  background: #fecaca;
  color: #dc2626;
}

.action-btn.delete:hover {
  background: #ef4444;
  color: white;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.danger {
  border: 2px solid #fecaca;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #111827;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

/* Forms */
.invite-form,
.edit-form {
  padding: 1.5rem;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.readonly-input {
  background: #f9fafb;
  color: #6b7280;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #6b7280;
  font-size: 0.75rem;
}

.checkbox-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.warning-text {
  color: #dc2626;
  font-size: 0.875rem;
  margin: 1rem 0;
}

.confirmation-input {
  margin-top: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* Dark theme support */
[data-theme="dark"] .user-management {
  background: #1f2937;
  color: #e5e7eb;
}

[data-theme="dark"] .user-management-header {
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border-bottom-color: #374151;
}

[data-theme="dark"] .user-management-header h2 {
  color: #f9fafb;
}

[data-theme="dark"] .users-table th {
  background: #374151;
  color: #f9fafb;
}

[data-theme="dark"] .user-row:hover {
  background: #374151;
}

[data-theme="dark"] .modal-content {
  background: #1f2937;
  color: #e5e7eb;
}

[data-theme="dark"] .modal-header {
  border-bottom-color: #374151;
}

[data-theme="dark"] .form-group input,
[data-theme="dark"] .form-group textarea,
[data-theme="dark"] .form-group select {
  background: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}
</style>
