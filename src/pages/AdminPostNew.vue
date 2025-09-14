<template>
  <DashboardLayout>
    <template #header>
      <h1 class="dashboard-title">
        <font-awesome-icon :icon="['fas','newspaper']" class="dashboard-svg-icon" />
        New Post
      </h1>
    </template>

    <div class="editor-surface">
      <form @submit.prevent="handleCreate" class="post-form" novalidate>
        <div class="form-grid">
          <label>
            <span>Title *</span>
            <input v-model="title" required class="input" placeholder="Enter title" />
          </label>
          <label>
            <span>Slug *</span>
            <input v-model="slug" required class="input" placeholder="auto-generated from title" />
          </label>
          <label>
            <span>Status</span>
            <select v-model="status" class="input">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </label>
          <label>
            <span>Featured</span>
            <input type="checkbox" v-model="featuredPost" />
          </label>
          <label>
            <span>Categories</span>
            <TokenMultiSelect
              v-model="selectedCategoryIds"
              :items="categories"
              placeholder="Search categories..."
            />
          </label>
          <label>
            <span>Tags</span>
            <TokenMultiSelect
              v-model="selectedTagIds"
              :items="tags"
              placeholder="Search tags..."
            />
          </label>
        </div>

        <div class="editor-block">
          <label class="block-label">Summary</label>
          <MarkdownEditor
            v-model="summary"
            placeholder="Short summary (optional markdown)"
            :char-count="true"
            autosave-key="post:new:summary"
            show-outline-toggle
            enable-images
            enable-tables
            enable-hr
            enable-tasks
          />
        </div>
        <div class="editor-block">
          <label class="block-label">Content *</label>
          <MarkdownEditor
            v-model="content"
            placeholder="Write your post content in Markdown..."
            autosave-key="post:new:content"
            show-outline
            show-outline-toggle
            show-stats
            enable-images
            enable-tables
            enable-hr
            enable-tasks
          />
        </div>

        <div class="actions">
          <router-link to="/admin/posts" class="btn btn-secondary">Cancel</router-link>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            <span v-if="submitting">Creating...</span>
            <span v-else>Create Post</span>
          </button>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import { useBlog } from '../composables/blog/useBlog';
import MarkdownEditor from '../components/MarkdownEditor.vue';
import { useCategories } from '../composables/blog/useCategories';
import { useTags } from '../composables/blog/useTags';
import TokenMultiSelect from '../components/TokenMultiSelect.vue';
import { useToasts } from '../composables/useToasts';

const { createPost, loading, error } = useBlog();
const { categories, fetchCategories } = useCategories();
const { tags, fetchTags } = useTags();

const title = ref('');
const slug = ref('');
const content = ref('');
const summary = ref('');
const status = ref<'DRAFT' | 'PUBLISHED'>('DRAFT');
const featuredPost = ref(false);
const submitting = ref(false);
const selectedCategoryIds = ref<string[]>([]);
const selectedTagIds = ref<string[]>([]);

watch(title, (t) => {
  if (!slug.value || slug.value === slugFrom(title.value)) {
    slug.value = slugFrom(t);
  }
});

function slugFrom(t: string) {
  return t.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

const { add: addToast } = useToasts();

// Fetch taxonomy data once
fetchCategories();
fetchTags();

async function handleCreate() {
  if (!title.value || !slug.value || !content.value) return;
  submitting.value = true;
  try {
    const created = await createPost({
      title: title.value,
      slug: slug.value,
      content: content.value,
      summary: summary.value,
      status: status.value,
      featuredPost: featuredPost.value,
      publishedAt: status.value === 'PUBLISHED' ? new Date().toISOString() : undefined
      , categoryIds: selectedCategoryIds.value, tagIds: selectedTagIds.value
    });
    if (created) {
      addToast({ title: 'Post Created', message: 'Your new post was created successfully.', type: 'success' });
      window.location.href = '/admin/posts';
    }
  } catch (e) {
    addToast({ title: 'Create Failed', message: 'Unable to create post. Check required fields and try again.', type: 'error', duration: 6000 });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.editor-surface { background: var(--color-card-light); padding: 1.25rem 1.25rem 2rem; border: 1px solid var(--color-border); border-radius: 16px; }
[data-theme="dark"] .editor-surface { background: var(--color-card-light); border-color: #2c3848; box-shadow: 0 4px 24px rgba(0,0,0,0.55); }
.post-form { display: flex; flex-direction: column; gap: 1.25rem; }
.form-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); }
label span { display:block; font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.35rem; }
.input { width:100%; padding:0.55rem 0.7rem; border:1px solid var(--color-border); border-radius:8px; font-size:0.9rem; background:#fff; }
[data-theme="dark"] .input { background:#1f2735; color: var(--color-text-light); border-color:#2c3848; }
.input:focus { outline:none; border-color: var(--color-primary); }
.textarea { resize:vertical; min-height:140px; }
.actions { display:flex; gap:0.75rem; justify-content:flex-end; align-items:center; margin-top:0.5rem; }
.error { color:#dc2626; font-size:0.8rem; }
.multi-select { min-height: 70px; }
.editor-block { display:flex; flex-direction:column; gap:0.4rem; }
.block-label { font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; }
</style>
