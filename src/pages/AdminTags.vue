<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">
        <font-awesome-icon :icon="['fas', 'tags']" class="dashboard-svg-icon" />
        Tags
      </h1>
    </template>

    <section class="tag-toolbar card-surface">
      <form class="new-tag-form" @submit.prevent="handleCreate">
        <input v-model="newName" class="input" placeholder="New tag name" required />
        <input v-model="newColor" class="input color-input" placeholder="#color" />
        <button type="submit" class="btn btn-primary" :disabled="creating">
          <font-awesome-icon :icon="['fas','plus']" />
          <span>Create</span>
        </button>
      </form>
      <div class="search-box">
        <input v-model="search" placeholder="Search tags..." class="input" />
      </div>
    </section>

    <section class="tags-table-wrapper card-surface">
      <div v-if="loading" class="loading-row">
        <div class="loading-spinner"></div>
        <span>Loading tags...</span>
      </div>
      <div v-else-if="error" class="error-row">{{ error }}</div>
      <div v-else-if="filtered.length === 0" class="empty-state">No tags found.</div>
      <table v-else class="tags-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Color</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tag in filtered" :key="tag.id">
            <td>
              <div v-if="editingId !== tag.id" class="name-cell">
                <span class="swatch" :style="{ background: tag.color || '#64748b' }"></span>
                {{ tag.name }}
              </div>
              <div v-else class="edit-field">
                <input v-model="editName" class="input" />
              </div>
            </td>
            <td>
              <span v-if="editingId !== tag.id">/{{ tag.slug }}</span>
              <input v-else v-model="editSlug" class="input" />
            </td>
            <td>
              <span v-if="editingId !== tag.id">{{ tag.color || '—' }}</span>
              <input v-else v-model="editColor" class="input" />
            </td>
            <td class="row-actions">
              <template v-if="editingId === tag.id">
                <button class="icon-btn" @click="saveEdit(tag)" title="Save">
                  <font-awesome-icon :icon="['fas','check']" />
                </button>
                <button class="icon-btn" @click="cancelEdit" title="Cancel">
                  <font-awesome-icon :icon="['fas','times']" />
                </button>
              </template>
              <template v-else>
                <button class="icon-btn" @click="startEdit(tag)" title="Edit">
                  <font-awesome-icon :icon="['fas','edit']" />
                </button>
                <button class="icon-btn danger" @click="confirmDelete(tag)" title="Delete">
                  <font-awesome-icon :icon="['fas','trash']" />
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="showDeleteConfirm" class="delete-confirm-overlay">
      <div class="delete-confirm-dialog">
        <p>Delete tag "{{ tagPendingDelete?.name }}"?</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="cancelDelete">Cancel</button>
          <button class="btn btn-danger" @click="performDelete">Delete</button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import { useTags } from '../composables/blog/useTags';
import { useToasts } from '../composables/useToasts';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const { tags, loading, error, fetchTags, createTag, updateTag, deleteTag } = useTags();

const search = ref('');
const newName = ref('');
const newColor = ref('');
const creating = ref(false);

// Editing
const editingId = ref<string | null>(null);
const editName = ref('');
const editSlug = ref('');
const editColor = ref('');

const filtered = computed(() => {
  const term = search.value.toLowerCase().trim();
  return tags.value.filter(t => !term || t.name?.toLowerCase().includes(term) || t.slug?.toLowerCase().includes(term));
});

const { add: addToast } = useToasts();

async function handleCreate() {
  if (!newName.value) return;
  creating.value = true;
  try {
    await createTag({ name: newName.value, color: newColor.value || undefined });
    addToast({ title: 'Tag Created', message: `"${newName.value}" added.`, type: 'success' });
    newName.value = '';
    newColor.value = '';
  } catch (e) {
    addToast({ title: 'Create Failed', message: 'Could not create tag.', type: 'error', duration: 6000 });
  } finally { creating.value = false; }
}

function startEdit(tag: any) {
  editingId.value = tag.id;
  editName.value = tag.name;
  editSlug.value = tag.slug;
  editColor.value = tag.color || '';
}
function cancelEdit() { editingId.value = null; }
async function saveEdit(tag: any) {
  try {
    await updateTag(tag.id, { name: editName.value, slug: editSlug.value, color: editColor.value || undefined });
    addToast({ title: 'Tag Updated', message: 'Changes saved.', type: 'success' });
  } catch (e) {
    addToast({ title: 'Update Failed', message: 'Could not save tag changes.', type: 'error', duration: 6000 });
  } finally {
    editingId.value = null;
  }
}

// Delete logic
const showDeleteConfirm = ref(false);
const tagPendingDelete = ref<any | null>(null);
function confirmDelete(tag: any) { tagPendingDelete.value = tag; showDeleteConfirm.value = true; }
function cancelDelete() { showDeleteConfirm.value = false; tagPendingDelete.value = null; }
async function performDelete() {
  if (!tagPendingDelete.value) return;
  const toDelete = tagPendingDelete.value;
  const id = toDelete.id;
  showDeleteConfirm.value = false;
  try {
    await deleteTag(id);
    addToast({ title: 'Tag Deleted', message: `"${toDelete.name}" removed.`, type: 'success' });
  } catch (e) {
    addToast({ title: 'Delete Failed', message: 'Tag could not be deleted.', type: 'error', duration: 6000 });
  } finally {
    tagPendingDelete.value = null;
  }
}

onMounted(async () => { await fetchTags(); });
</script>

<style scoped>
.tag-toolbar, .tags-table-wrapper { margin-bottom: 1.75rem; background: var(--color-card-light); border: 1px solid var(--color-border); border-radius: 16px; padding: 1.25rem 1.25rem 1rem; }
[data-theme="dark"] .tag-toolbar, [data-theme="dark"] .tags-table-wrapper { background: var(--color-card-light); border-color: #2c3848; box-shadow: 0 4px 20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05); }
.new-tag-form { display:flex; gap:0.6rem; flex-wrap:wrap; }
.search-box { margin-left:auto; display:flex; align-items:center; }
.input { padding:0.55rem 0.7rem; border:1px solid var(--color-border); border-radius:8px; font-size:0.85rem; background:#fff; }
[data-theme="dark"] .input { background:#1f2735; color: var(--color-text-light); border-color:#2c3848; }
.input:focus { outline:none; border-color: var(--color-primary); }
.color-input { width:140px; }
.tags-table { width:100%; border-collapse:collapse; font-size:0.8rem; }
.tags-table th, .tags-table td { padding:0.6rem 0.7rem; border-bottom:1px solid var(--color-border); text-align:left; }
[data-theme="dark"] .tags-table th, [data-theme="dark"] .tags-table td { border-color:#2c3848; }
.tags-table thead th { font-weight:600; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; }
.row-actions { display:flex; gap:0.45rem; }
.icon-btn { background:#f1f5f9; border:1px solid var(--color-border); width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#334155; }
.icon-btn:hover { background:#e2e8f0; }
[data-theme="dark"] .icon-btn { background:#1f2735; border-color:#2c3848; color: var(--color-text-light); }
[data-theme="dark"] .icon-btn:hover { background:#273142; }
.icon-btn.danger { background:#fee2e2; color:#991b1b; border-color:#fecaca; }
.icon-btn.danger:hover { background:#fecaca; }
[data-theme="dark"] .icon-btn.danger { background:#3f1f23; color:#fda4af; border-color:#7f1d1d; }
[data-theme="dark"] .icon-btn.danger:hover { background:#5b252c; }
.swatch { width:14px; height:14px; border-radius:4px; display:inline-block; margin-right:0.5rem; box-shadow:0 0 0 1px rgba(0,0,0,0.15); vertical-align:middle; }
[data-theme="dark"] .swatch { box-shadow:0 0 0 1px rgba(255,255,255,0.15); }
.loading-row, .error-row, .empty-state { padding:2rem 1rem; text-align:center; }
.error-row { color:#dc2626; }
.delete-confirm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:2100; }
.delete-confirm-dialog { background:var(--color-card-light); padding:1.4rem 1.25rem; border-radius:14px; width:min(340px,90%); border:1px solid var(--color-border); box-shadow:0 4px 24px rgba(0,0,0,0.2); }
[data-theme="dark"] .delete-confirm-dialog { background:#1f2735; border-color:#2c3848; }
.confirm-actions { display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem; }
@media (max-width: 800px) {
  .new-tag-form { width:100%; }
  .search-box { width:100%; margin-left:0; margin-top:0.75rem; }
  .tag-toolbar { display:flex; flex-direction:column; align-items:flex-start; }
}
</style>
