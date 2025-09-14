<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">
        <font-awesome-icon :icon="['fas', 'folder-open']" class="dashboard-svg-icon" />
        Categories
      </h1>
    </template>

    <section class="category-toolbar card-surface">
      <form class="new-category-form" @submit.prevent="handleCreate">
        <input v-model="newName" class="input" placeholder="New category name" required />
        <div ref="colorWrapperRef" class="color-picker-wrapper">
          <input
            v-model="newColor"
            class="input color-hex-input"
            placeholder="#color"
            @focus="openColorPanel"
            @keydown.esc.prevent="closeColorPanel"
            @blur="onColorBlur"
            aria-haspopup="dialog"
            :aria-expanded="showColorPanel ? 'true' : 'false'"
          />
          <transition name="fade-scale">
            <div
              v-if="showColorPanel"
              class="color-popover"
              role="dialog"
              aria-label="Choose a color"
              @mousedown.prevent
            >
              <div class="popover-row">
                <input v-model="newColor" type="color" class="native-color" aria-label="Pick color" />
                <button type="button" class="clear-btn" v-if="newColor" @click="clearColor" title="Clear color">×</button>
              </div>
              <div class="swatches" aria-label="Preset colors">
                <button type="button" v-for="p in presetColors" :key="p" class="swatch-btn" :style="{ background: p }" @click="selectPreset(p)" :title="p">
                  <span v-if="p.toLowerCase()===newColor.toLowerCase()" class="swatch-indicator"></span>
                </button>
              </div>
              <div class="popover-actions">
                <button type="button" class="btn btn-secondary btn-xs" @click="closeColorPanel">Done</button>
              </div>
            </div>
          </transition>
        </div>
        <button type="submit" class="btn btn-primary" :disabled="creating">
          <font-awesome-icon :icon="['fas','plus']" />
          <span>Create</span>
        </button>
      </form>
      <div class="search-box">
        <input v-model="search" placeholder="Search categories..." class="input" />
      </div>
    </section>

    <section class="categories-table-wrapper card-surface">
      <div v-if="loading" class="loading-row">
        <div class="loading-spinner"></div>
        <span>Loading categories...</span>
      </div>
      <div v-else-if="error" class="error-row">{{ error }}</div>
      <div v-else-if="filtered.length === 0" class="empty-state">No categories found.</div>
      <table v-else class="categories-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Color</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in filtered" :key="cat.id">
            <td>
              <div v-if="editingId !== cat.id" class="name-cell">
                <span class="swatch" :style="{ background: cat.color || '#64748b' }"></span>
                {{ cat.name }}
              </div>
              <div v-else class="edit-field">
                <input v-model="editName" class="input" />
              </div>
            </td>
            <td>
              <span v-if="editingId !== cat.id">/{{ cat.slug }}</span>
              <input v-else v-model="editSlug" class="input" />
            </td>
            <td>
              <span v-if="editingId !== cat.id">{{ cat.color || '—' }}</span>
              <input v-else v-model="editColor" class="input" />
            </td>
            <td class="row-actions">
              <template v-if="editingId === cat.id">
                <button class="icon-btn" @click="saveEdit(cat)" title="Save">
                  <font-awesome-icon :icon="['fas','check']" />
                </button>
                <button class="icon-btn" @click="cancelEdit" title="Cancel">
                  <font-awesome-icon :icon="['fas','times']" />
                </button>
              </template>
              <template v-else>
                <button class="icon-btn" @click="startEdit(cat)" title="Edit">
                  <font-awesome-icon :icon="['fas','edit']" />
                </button>
                <button class="icon-btn danger" @click="confirmDelete(cat)" title="Delete">
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
        <p>Delete category "{{ categoryPendingDelete?.name }}"?</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="cancelDelete">Cancel</button>
          <button class="btn btn-danger" @click="performDelete">Delete</button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import { useCategories } from '../composables/blog/useCategories';
import { useToasts } from '../composables/useToasts';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const { categories, loading, error, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategories();

const search = ref('');
const newName = ref('');
const newColor = ref('');
const creating = ref(false);
const presetColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#64748b'];
const showColorPanel = ref(false);
const colorWrapperRef = ref<HTMLElement | null>(null);

// Editing state
const editingId = ref<string | null>(null);
const editName = ref('');
const editSlug = ref('');
const editColor = ref('');

const filtered = computed(() => {
  const term = search.value.toLowerCase().trim();
  return categories.value.filter(c => !term || c.name?.toLowerCase().includes(term) || c.slug?.toLowerCase().includes(term));
});

const { add: addToast } = useToasts();

async function handleCreate() {
  if (!newName.value) return;
  creating.value = true;
  try {
    const normalized = normalizeColor(newColor.value);
    await createCategory({ name: newName.value, color: normalized || undefined });
    addToast({ title: 'Category Created', message: `"${newName.value}" added.`, type: 'success' });
    newName.value = '';
    newColor.value = '';
  } catch (e) {
    addToast({ title: 'Create Failed', message: 'Could not create category.', type: 'error', duration: 6000 });
  } finally { creating.value = false; }
}

function selectPreset(p: string) {
  newColor.value = p;
}

function clearColor() {
  newColor.value = '';
}

function normalizeColor(val: string): string | '' {
  if (!val) return '';
  let v = val.trim();
  if (/^[0-9a-f]{3}$/i.test(v)) v = '#' + v;
  if (/^[0-9a-f]{6}$/i.test(v)) v = '#' + v;
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    // expand shorthand #abc -> #aabbcc for consistency with native color input (#rrggbb)
    v = '#' + v.slice(1).split('').map(c => c + c).join('');
  }
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  return '';
}

function onColorBlur() {
  const norm = normalizeColor(newColor.value);
  if (norm) newColor.value = norm;
}

function openColorPanel() {
  showColorPanel.value = true;
  attachOutsideListener();
}
function closeColorPanel() {
  showColorPanel.value = false;
  detachOutsideListener();
}

function handleDocumentClick(e: MouseEvent) {
  if (!showColorPanel.value) return;
  const target = e.target as Node;
  if (colorWrapperRef.value && !colorWrapperRef.value.contains(target)) {
    closeColorPanel();
  }
}

function attachOutsideListener() {
  document.addEventListener('mousedown', handleDocumentClick);
}
function detachOutsideListener() {
  document.removeEventListener('mousedown', handleDocumentClick);
}

function startEdit(cat: any) {
  editingId.value = cat.id;
  editName.value = cat.name;
  editSlug.value = cat.slug;
  editColor.value = cat.color || '';
}
function cancelEdit() { editingId.value = null; }
async function saveEdit(cat: any) {
  try {
    await updateCategory(cat.id, { name: editName.value, slug: editSlug.value, color: editColor.value || undefined });
    addToast({ title: 'Category Updated', message: 'Changes saved.', type: 'success' });
  } catch (e) {
    addToast({ title: 'Update Failed', message: 'Could not save category changes.', type: 'error', duration: 6000 });
  } finally {
    editingId.value = null;
  }
}

// Delete handling
const showDeleteConfirm = ref(false);
const categoryPendingDelete = ref<any | null>(null);
function confirmDelete(cat: any) { categoryPendingDelete.value = cat; showDeleteConfirm.value = true; }
function cancelDelete() { showDeleteConfirm.value = false; categoryPendingDelete.value = null; }
async function performDelete() {
  if (!categoryPendingDelete.value) return;
  const toDelete = categoryPendingDelete.value;
  const id = toDelete.id;
  showDeleteConfirm.value = false;
  try {
    await deleteCategory(id);
    addToast({ title: 'Category Deleted', message: `"${toDelete.name}" removed.`, type: 'success' });
  } catch (e) {
    addToast({ title: 'Delete Failed', message: 'Category could not be deleted.', type: 'error', duration: 6000 });
  } finally {
    categoryPendingDelete.value = null;
  }
}

onMounted(async () => {
  await fetchCategories();
});

onBeforeUnmount(() => {
  detachOutsideListener();
});
</script>

<style scoped>
.category-toolbar, .categories-table-wrapper { margin-bottom: 1.75rem; background: var(--color-card-light); border: 1px solid var(--color-border); border-radius: 16px; padding: 1.25rem 1.25rem 1rem; }
[data-theme="dark"] .category-toolbar, [data-theme="dark"] .categories-table-wrapper { background: var(--color-card-light); border-color: #2c3848; box-shadow: 0 4px 20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05); }

.new-category-form { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.search-box { margin-left: auto; display: flex; align-items: center; }
.input { padding: 0.55rem 0.7rem; border:1px solid var(--color-border); border-radius:8px; font-size:0.85rem; background:#fff; }
[data-theme="dark"] .input { background:#1f2735; color: var(--color-text-light); border-color:#2c3848; }
.input:focus { outline:none; border-color: var(--color-primary); }
.color-input { width: 140px; }
.color-picker-cluster { display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap; }
.color-hex-input { width:130px; }
.native-color { width:42px; height:34px; padding:0; border:1px solid var(--color-border); border-radius:8px; background:transparent; cursor:pointer; }
[data-theme="dark"] .native-color { border-color:#2c3848; }
.swatches { display:flex; gap:0.35rem; align-items:center; }
.swatch-btn { position:relative; width:28px; height:28px; border:none; border-radius:6px; cursor:pointer; box-shadow:0 0 0 1px rgba(0,0,0,0.2); display:flex; align-items:center; justify-content:center; }
[data-theme="dark"] .swatch-btn { box-shadow:0 0 0 1px rgba(255,255,255,0.18); }
.swatch-btn:hover { outline:2px solid var(--color-primary); outline-offset:2px; }
.swatch-indicator { width:10px; height:10px; background:#fff; border-radius:50%; box-shadow:0 0 0 2px rgba(0,0,0,0.25); }
[data-theme="dark"] .swatch-indicator { background:#1f2735; box-shadow:0 0 0 2px rgba(255,255,255,0.35); }

/* Popover variant */
.color-picker-wrapper { position:relative; }
.color-popover { position:absolute; top:100%; left:0; margin-top:0.4rem; background:var(--color-card-light); border:1px solid var(--color-border); padding:0.6rem 0.65rem 0.55rem; border-radius:12px; width:260px; box-shadow:0 8px 32px -4px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.06); z-index:1500; }
[data-theme="dark"] .color-popover { background:var(--color-card-light); border-color:#2c3848; box-shadow:0 8px 40px -4px rgba(0,0,0,0.65); }
.popover-row { display:flex; gap:0.5rem; align-items:center; margin-bottom:0.55rem; }
.popover-actions { margin-top:0.55rem; display:flex; justify-content:flex-end; }
.clear-btn { background:#f1f5f9; border:1px solid var(--color-border); border-radius:6px; width:34px; height:34px; cursor:pointer; font-size:1.1rem; line-height:1; display:flex; align-items:center; justify-content:center; }
[data-theme="dark"] .clear-btn { background:#1f2735; border-color:#2c3848; color:var(--color-text-light); }
.clear-btn:hover { background:#e2e8f0; }
[data-theme="dark"] .clear-btn:hover { background:#273142; }

/* Transition */
.fade-scale-enter-active,.fade-scale-leave-active { transition: opacity 120ms ease, transform 120ms ease; }
.fade-scale-enter-from,.fade-scale-leave-to { opacity:0; transform:translateY(-4px) scale(.96); }

/* Compact secondary button size */
.btn-xs { font-size:0.65rem; padding:0.35rem 0.55rem; border-radius:6px; }

.categories-table { width:100%; border-collapse: collapse; font-size:0.8rem; }
.categories-table th, .categories-table td { padding:0.6rem 0.7rem; border-bottom:1px solid var(--color-border); text-align:left; }
[data-theme="dark"] .categories-table th, [data-theme="dark"] .categories-table td { border-color:#2c3848; }
.categories-table thead th { font-weight:600; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; }

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
.edit-field { display:flex; }

.loading-row, .error-row, .empty-state { padding: 2rem 1rem; text-align:center; }
.error-row { color:#dc2626; }

/* Delete confirmation */
.delete-confirm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:2100; }
.delete-confirm-dialog { background:var(--color-card-light); padding:1.4rem 1.25rem; border-radius:14px; width:min(340px,90%); border:1px solid var(--color-border); box-shadow:0 4px 24px rgba(0,0,0,0.2); }
[data-theme="dark"] .delete-confirm-dialog { background:#1f2735; border-color:#2c3848; }
.confirm-actions { display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem; }

@media (max-width: 800px) {
  .new-category-form { width:100%; }
  .search-box { width:100%; margin-left:0; margin-top:0.75rem; }
  .category-toolbar { display:flex; flex-direction:column; align-items:flex-start; }
}
</style>
