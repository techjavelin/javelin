<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">
        <font-awesome-icon :icon="['fas', 'newspaper']" class="dashboard-svg-icon" />
        Posts
      </h1>
    </template>

    <section class="posts-toolbar card-surface">
      <div class="filters-left">
        <div class="search-box">
          <input
            v-model="search"
            type="text"
            placeholder="Search posts..."
            class="input"
            @keyup.enter="applySearch"
          />
          <button class="btn btn-secondary" @click="applySearch">Search</button>
        </div>
        <select v-model="statusFilter" class="input select">
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>
      <div class="actions-right">
        <router-link to="/admin/posts/new" class="btn btn-primary new-post-btn">
          <font-awesome-icon :icon="['fas', 'plus']" />
          <span>New Post</span>
        </router-link>
      </div>
    </section>

    <section class="posts-table-wrapper card-surface">
  <div v-if="loading" class="loading-row">
        <div class="loading-spinner"></div>
        <span>Loading posts...</span>
      </div>
  <div v-else-if="error" class="error-row">{{ error }}</div>
      <div v-else-if="filteredPosts.length === 0" class="empty-state">
        <p>No posts found.</p>
      </div>
      <table v-else class="posts-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Views</th>
            <th>Updated</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in pagedPosts" :key="post.id">
            <td class="title-cell">
              <router-link :to="`/blog/${post.slug}`" target="_blank" class="post-link">{{ post.title }}</router-link>
              <div class="slug">/{{ post.slug }}</div>
            </td>
            <td>
              <span class="status-pill" :class="(post.status || '').toLowerCase()">{{ post.status || '—' }}</span>
            </td>
            <td>{{ post.viewCount || 0 }}</td>
            <td>{{ formatDate(post.updatedAt || post.createdAt) }}</td>
            <td class="row-actions">
              <button class="icon-btn" @click="togglePublish(post)" :title="post.status==='PUBLISHED' ? 'Unpublish' : 'Publish'">
                <font-awesome-icon :icon="post.status==='PUBLISHED' ? ['fas','eye-slash'] : ['fas','eye']" />
              </button>
              <router-link :to="`/admin/posts/${post.id}/edit`" class="icon-btn" title="Edit">
                <font-awesome-icon :icon="['fas','edit']" />
              </router-link>
              <button class="icon-btn danger" @click="confirmDelete(post)" title="Delete">
                <font-awesome-icon :icon="['fas','trash']" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredPosts.length > pageSize" class="pagination">
        <button class="pager-btn" :disabled="page===1" @click="page--">Prev</button>
        <span class="page-info">Page {{ page }} / {{ totalPages }}</span>
        <button class="pager-btn" :disabled="page===totalPages" @click="page++">Next</button>
      </div>
    </section>

    <!-- Delete confirmation (simple inline version for now) -->
    <div v-if="showDeleteConfirm" class="delete-confirm-overlay">
      <div class="delete-confirm-dialog">
        <p>Delete post "{{ postPendingDelete?.title }}"?</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="cancelDelete">Cancel</button>
          <button class="btn btn-danger" @click="performDelete">Delete</button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBlog } from '../composables/blog/useBlog'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useToasts } from '../composables/useToasts'

const { posts, loading, error, fetchPosts, updatePost, deletePost } = useBlog()
// Unwrap for template (vue template automatically unwraps refs, but keep aliases for clarity/types)
// Type assertions ensure we treat error possibly null

// Filters & pagination
const search = ref('')
const appliedSearch = ref('')
const statusFilter = ref<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL')
const page = ref(1)
const pageSize = 20

const filteredPosts = computed(() => {
  const term = appliedSearch.value.toLowerCase().trim()
  return posts.value.filter(p => {
    const matchesSearch = !term || p.title?.toLowerCase().includes(term) || p.slug?.toLowerCase().includes(term)
    const matchesStatus = statusFilter.value === 'ALL' || p.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPosts.value.length / pageSize)))
const pagedPosts = computed(() => {
  if (page.value > totalPages.value) page.value = totalPages.value
  const start = (page.value - 1) * pageSize
  return filteredPosts.value.slice(start, start + pageSize)
})

function applySearch() {
  appliedSearch.value = search.value
  page.value = 1
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  try { return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) } catch { return '—' }
}

// Publish / Unpublish
const { add: addToast } = useToasts()

async function togglePublish(post: any) {
  const targetStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
  const originalStatus = post.status
  post.status = targetStatus
  try {
    await updatePost(post.id, { status: targetStatus, publishedAt: targetStatus === 'PUBLISHED' ? new Date().toISOString() : null })
    addToast({ title: targetStatus === 'PUBLISHED' ? 'Post Published' : 'Post Unpublished', message: `"${post.title}" is now ${targetStatus.toLowerCase()}.`, type: 'success' })
  } catch (e) {
    post.status = originalStatus // revert on error
    addToast({ title: 'Update Failed', message: 'Could not change publish status. Please retry.', type: 'error', duration: 6000 })
  }
}

// Delete handling
const showDeleteConfirm = ref(false)
const postPendingDelete = ref<any | null>(null)
function confirmDelete(post: any) {
  postPendingDelete.value = post
  showDeleteConfirm.value = true
}
function cancelDelete() {
  showDeleteConfirm.value = false
  postPendingDelete.value = null
}
async function performDelete() {
  if (!postPendingDelete.value) return
  const toDelete = postPendingDelete.value
  const id = toDelete.id
  showDeleteConfirm.value = false
  const prev = [...posts.value]
  // optimistic removal
  posts.value = posts.value.filter(p => p.id !== id)
  try {
    await deletePost(id)
    addToast({ title: 'Post Deleted', message: `"${toDelete.title}" was removed.`, type: 'success' })
  } catch (e) {
    posts.value = prev // rollback
    addToast({ title: 'Delete Failed', message: 'Post could not be deleted. Rolled back.', type: 'error', duration: 6000 })
  } finally {
    postPendingDelete.value = null
  }
}

onMounted(async () => {
  await fetchPosts()
})
</script>

<style scoped>
/* Layout sections */
.posts-toolbar, .posts-table-wrapper {
  margin-bottom: 1.75rem;
  background: var(--color-card-light);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.25rem 1.25rem 1rem;
}
[data-theme="dark"] .posts-toolbar, [data-theme="dark"] .posts-table-wrapper {
  background: var(--color-card-light); /* swapped via dark vars */
  border-color: rgba(255,255,255,0.09);
  box-shadow: 0 4px 20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05);
}

.filters-left { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
.actions-right { margin-left: auto; display: flex; gap: 0.75rem; }
.posts-toolbar { display: flex; flex-wrap: wrap; align-items: center; }

.search-box { display: flex; gap: 0.5rem; }
.input { padding: 0.55rem 0.75rem; border: 1px solid var(--color-border); border-radius: 8px; font-size: 0.9rem; background: #fff; }
[data-theme="dark"] .input { background: #1f2735; color: var(--color-text-light); border-color: #2c3848; }
.input:focus { outline: none; border-color: var(--color-primary); }
.select { min-width: 140px; }

.new-post-btn { display: inline-flex; gap: 0.5rem; align-items: center; }

/* Table */
.posts-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.posts-table th, .posts-table td { padding: 0.65rem 0.75rem; text-align: left; border-bottom: 1px solid var(--color-border); }
.posts-table thead th { font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-light); }
[data-theme="dark"] .posts-table th, [data-theme="dark"] .posts-table td { border-color: #2c3848; }

.title-cell { max-width: 320px; }
.post-link { color: var(--color-primary); font-weight: 600; text-decoration: none; }
.post-link:hover { text-decoration: underline; }
.slug { font-size: 0.65rem; opacity: 0.6; }

.status-pill { display: inline-block; padding: 0.3rem 0.55rem; border-radius: 999px; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.05em; }
.status-pill.published { background: #16a34a; color: #fff; }
.status-pill.draft { background: #475569; color: #fff; }

.row-actions { display: flex; gap: 0.5rem; align-items: center; }
.icon-btn { background: #f1f5f9; border: 1px solid var(--color-border); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #334155; transition: background 0.15s, color 0.15s; }
.icon-btn:hover { background: #e2e8f0; }
.icon-btn.danger { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
.icon-btn.danger:hover { background: #fecaca; }
[data-theme="dark"] .icon-btn { background: #1f2735; color: #cbd5e1; border-color: #2c3848; }
[data-theme="dark"] .icon-btn:hover { background: #273142; }
[data-theme="dark"] .icon-btn.danger { background: #3f1f23; color: #fda4af; border-color: #7f1d1d; }
[data-theme="dark"] .icon-btn.danger:hover { background: #5b252c; }

.loading-row, .error-row, .empty-state { padding: 2rem 1rem; text-align: center; color: var(--color-text-light); }
.error-row { color: #dc2626; }

/* Pagination */
.pagination { display: flex; gap: 1rem; align-items: center; justify-content: flex-end; padding-top: 0.75rem; }
.pager-btn { background: var(--color-card-light); border: 1px solid var(--color-border); padding: 0.45rem 0.9rem; border-radius: 8px; font-size: 0.75rem; cursor: pointer; }
.pager-btn:disabled { opacity: 0.5; cursor: default; }
[data-theme="dark"] .pager-btn { background: #1f2735; border-color: #2c3848; color: var(--color-text-light); }
.page-info { font-size: 0.7rem; opacity: 0.75; }

/* Delete confirmation */
.delete-confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 2100; }
.delete-confirm-dialog { background: var(--color-card-light); padding: 1.5rem 1.25rem; border-radius: 14px; width: min(340px, 90%); border: 1px solid var(--color-border); box-shadow: 0 4px 24px rgba(0,0,0,0.2); }
[data-theme="dark"] .delete-confirm-dialog { background: #1f2735; border-color: #2c3848; }
.confirm-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }

/* Reuse shared theme tokens for small surface */
.card-surface { box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
[data-theme="dark"] .card-surface { box-shadow: 0 4px 24px rgba(0,0,0,0.55); }

@media (max-width: 900px) {
  .filters-left { width: 100%; }
  .actions-right { width: 100%; justify-content: flex-start; margin-top: 0.75rem; }
  .posts-toolbar { flex-direction: column; align-items: flex-start; }
  .title-cell { max-width: 100%; }
  .row-actions { flex-wrap: wrap; }
}
</style>
