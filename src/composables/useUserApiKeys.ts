import { ref } from 'vue';
import { fetchAuthSession } from 'aws-amplify/auth';

// Lazy load amplify outputs (pattern reused from other composables)
async function loadOutputs(): Promise<any> {
  try {
    const mod = await import('../../amplify_outputs.json', { assert: { type: 'json' } } as any);
    return (mod as any).default || mod;
  } catch {
    try {
      const mod = await import('../../amplify_outputs.json');
      return (mod as any).default || mod;
    } catch { return {}; }
  }
}
let outputsCache: any | null = null;
async function getOutputs(): Promise<any> { if(outputsCache) return outputsCache; outputsCache = await loadOutputs(); return outputsCache; }

export interface UserApiKeyMeta { id: string; name?: string; createdDate?: string; value?: string; }

export function useUserApiKeys(){
  const keys = ref<UserApiKeyMeta[]>([]);
  const loading = ref(false);
  const creating = ref(false);
  const deleting = ref<string | null>(null);
  const error = ref('');
  const lastCreated = ref<UserApiKeyMeta | null>(null); // holds value only once after creation

  async function authHeaders(): Promise<Record<string,string>> {
    try {
      const session = await fetchAuthSession();
      const token = (session as any)?.tokens?.idToken?.toString?.();
      if(token) return { 'Content-Type':'application/json', 'Authorization': token };
    } catch {}
    return { 'Content-Type':'application/json' };
  }

  async function baseUrl(): Promise<string> {
    const outs = await getOutputs();
    const api = outs?.custom?.API || {};
    const restEntry: any = Object.values(api)[0];
    if(!restEntry?.endpoint) throw new Error('REST endpoint missing');
    return restEntry.endpoint.replace(/\/$/, '');
  }

  async function list(){
    loading.value = true; error.value='';
    try {
      const url = (await baseUrl()) + '/user-api-keys';
      const res = await fetch(url, { headers: await authHeaders() });
      if(!res.ok) throw new Error('List failed ' + res.status);
      keys.value = await res.json();
    } catch(e:any){ error.value = e.message || 'Failed to list keys'; }
    finally { loading.value = false; }
  }

  async function create(name?: string){
    creating.value = true; error.value=''; lastCreated.value = null;
    try {
      const url = (await baseUrl()) + '/user-api-keys';
      const res = await fetch(url, { method: 'POST', headers: await authHeaders(), body: JSON.stringify(name?{ name }:{}) });
      if(res.status !== 201) throw new Error('Create failed ' + res.status);
      const json = await res.json();
      // Save returned value temporarily; subsequent list() will not include it by design
      lastCreated.value = json;
      await list();
    } catch(e:any){ error.value = e.message || 'Failed to create key'; }
    finally { creating.value = false; }
  }

  async function remove(id: string){
    deleting.value = id; error.value='';
    try {
      const url = (await baseUrl()) + '/user-api-keys/' + encodeURIComponent(id);
      const res = await fetch(url, { method: 'DELETE', headers: await authHeaders() });
      if(!res.ok) throw new Error('Delete failed ' + res.status);
      await list();
    } catch(e:any){ error.value = e.message || 'Failed to delete key'; }
    finally { deleting.value = null; }
  }

  return { keys, loading, creating, deleting, error, lastCreated, list, create, remove };
}
