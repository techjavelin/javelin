<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useUserApiKeys } from '../../composables/useUserApiKeys';

const { keys, loading, creating, deleting, error, lastCreated, list, create, remove } = useUserApiKeys();
const newName = ref('');

onMounted(() => { list(); });

function copy(value?: string){
  if(!value) return;
  navigator.clipboard.writeText(value).catch(()=>{});
}

</script>

<template>
  <div class="user-api-key-manager">
    <h3>User API Keys</h3>
    <p class="desc">Create and manage personal API keys. Key values are shown only once at creation—store them securely.</p>
    <div v-if="error" class="error">{{ error }}</div>
    <div class="create-form">
      <input v-model="newName" placeholder="Optional key name" :disabled="creating" />
      <button @click="create(newName || undefined)" :disabled="creating">{{ creating ? 'Creating...' : 'Create Key' }}</button>
    </div>
    <div v-if="lastCreated" class="new-key">
      <strong>New Key Created:</strong>
      <div>ID: {{ lastCreated.id }}</div>
      <div>Name: {{ lastCreated.name }}</div>
      <div class="value">Value: <code>{{ lastCreated.value }}</code> <button @click="copy(lastCreated.value)">Copy</button></div>
      <div class="hint">This value will not be shown again.</div>
    </div>
    <h4>Existing Keys</h4>
    <div v-if="loading">Loading...</div>
    <table v-else class="keys-table" v-if="keys.length">
      <thead>
        <tr><th>ID</th><th>Name</th><th>Created</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="k in keys" :key="k.id">
          <td>{{ k.id }}</td>
          <td>{{ k.name }}</td>
          <td>{{ k.createdDate ? new Date(k.createdDate).toLocaleString() : '' }}</td>
          <td>
            <button @click="remove(k.id)" :disabled="deleting===k.id">{{ deleting===k.id ? 'Deleting...' : 'Delete' }}</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty">No keys yet.</div>
  </div>
</template>

<style scoped>
.user-api-key-manager { border: 1px solid #ddd; padding: 1rem; border-radius: 6px; background: #fafafa; }
.create-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
input { flex: 1; padding: 0.4rem; }
button { cursor: pointer; }
.error { color: #b00020; margin-bottom: 0.5rem; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ddd; padding: 0.4rem; font-size: 0.85rem; }
th { background: #f0f0f0; text-align: left; }
.new-key { background: #fff3cd; padding: 0.6rem; margin: 0.5rem 0 1rem; border: 1px solid #ffeeba; }
.value code { background: #333; color: #fff; padding: 0.2rem 0.4rem; border-radius: 4px; }
.hint { font-size: 0.75rem; color: #555; }
.empty { font-style: italic; }
.desc { font-size: 0.85rem; color: #555; }
</style>
