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
        </div>

        <label class="block">
          <span>Summary</span>
          <textarea v-model="summary" rows="2" class="input textarea" />
        </label>
        <label class="block">
          <span>Content *</span>
          <textarea v-model="content" rows="10" class="input textarea" required />
        </label>

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
import { useToasts } from '../composables/useToasts';

const { createPost, loading, error } = useBlog();

const title = ref('');
const slug = ref('');
const content = ref('');
const summary = ref('');
const status = ref<'DRAFT' | 'PUBLISHED'>('DRAFT');
const featuredPost = ref(false);
const submitting = ref(false);

watch(title, (t) => {
  if (!slug.value || slug.value === slugFrom(title.value)) {
    slug.value = slugFrom(t);
  }
});

function slugFrom(t: string) {
  return t.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

const { add: addToast } = useToasts();

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
</style>
