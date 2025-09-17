import { ref } from 'vue'
import { generateClient } from 'aws-amplify/data'
import { withAuth } from '../amplifyClient'
import type { Schema } from '@/../amplify/data/resource'
import { uploadData, remove as removeObject, getUrl } from 'aws-amplify/storage'
import { useAuthorization } from './useAuthorization'

const client = generateClient<Schema>()

// Hash helper (sha-256 hex)
async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('')
}

export function useArtifacts() {
  const artifacts = ref<Schema['ArtifactLink']['type'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const { has } = useAuthorization()

  function scopeKey(parts: (string|undefined|null)[]) { return parts.filter(Boolean).join('/') }

  async function list(params: { organizationId: string; engagementId?: string; applicationId?: string } ) {
    loading.value=true; error.value=null
    try {
      const filter: any = { organizationId: { eq: params.organizationId } }
      if (params.engagementId) filter.engagementId = { eq: params.engagementId }
      if (params.applicationId) filter.applicationId = { eq: params.applicationId }
      const resp = await client.models.ArtifactLink.list(withAuth({ filter }))
      artifacts.value = resp.data || []
    } catch (e:any){ error.value = e.message || 'Failed to load artifacts' } finally { loading.value=false }
  }

  async function upload(params: { file: File; organizationId: string; engagementId?: string; applicationId?: string; name?: string; description?: string }) {
    const { file, organizationId, engagementId, applicationId } = params
    if (engagementId && !has('ENG.MANAGE', { engagementId })) throw new Error('Forbidden: ENG.MANAGE required')
    loading.value=true; error.value=null
    try {
      const hash = await sha256Hex(file)
      // Temporary id folder via timestamp+rand (record id not known yet)
      const tempId = crypto.randomUUID()
      const base = engagementId ? `eng/${engagementId}` : applicationId ? `app/${applicationId}` : 'org'
      const key = scopeKey(['artifacts','org', organizationId, base, tempId, file.name])
  await uploadData({ key, data: file, options: { contentType: file.type } }).result
      const resp = await client.models.ArtifactLink.create(withAuth({
        organizationId,
        engagementId,
        applicationId,
        name: params.name || file.name,
        description: params.description,
        storageKey: key,
        contentType: file.type,
        size: file.size,
        sha256: hash
      } as any))
      if (resp.data) artifacts.value = [resp.data as any, ...artifacts.value]
      return resp.data || null
    } catch (e:any){ error.value = e.message || 'Upload failed'; throw e } finally { loading.value=false }
  }

  async function remove(artifact: { id:string; storageKey?: string }) {
    loading.value=true; error.value=null
    try {
  if (artifact.storageKey) { try { await removeObject({ key: artifact.storageKey }) } catch {/* ignore */} }
      await client.models.ArtifactLink.delete({ id: artifact.id } as any)
      artifacts.value = artifacts.value.filter(a => a.id !== artifact.id)
    } catch (e:any){ error.value = e.message || 'Delete failed'; throw e } finally { loading.value=false }
  }

  async function downloadUrl(artifact: { storageKey?: string }) {
    if (!artifact.storageKey) throw new Error('Missing storageKey')
    const { url } = await getUrl({ key: artifact.storageKey, options: { expiresIn: 300 } as any })
    return url.toString()
  }

  return { artifacts, loading, error, list, upload, remove, downloadUrl }
}
