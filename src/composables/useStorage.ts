import { ref } from 'vue';
import { uploadData, getUrl, type UploadDataInput } from 'aws-amplify/storage';
import { useToasts } from './useToasts';
import { fetchAuthSession } from 'aws-amplify/auth';

interface UploadResult { key: string; url: string }

// Simple hash utility fallback if sha256 service not implemented
async function hashString(input: string) {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const enc = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(digest)).slice(0,8).map(b=>b.toString(16).padStart(2,'0')).join('');
    }
  } catch {}
  // Fallback poor-man hash
  let h = 0; for (let i=0;i<input.length;i++) { h = (h * 31 + input.charCodeAt(i)) >>> 0; }
  return h.toString(16);
}

export function useStorage() {
  const uploading = ref(false);
  const progress = ref(0);
  const error = ref<string | null>(null);
  const { add: addToast } = useToasts();

  function buildKey(opts: { postId?: string; draftId?: string; filename: string }) {
    const base = opts.postId ? `posts/${opts.postId}` : `drafts/${opts.draftId || 'unknown'}`;
    return `${base}/images/${opts.filename}`;
  }

  async function ensureAuthenticated() {
    try {
      const session = await fetchAuthSession();
      return !!session.tokens?.accessToken;
    } catch {
      return false;
    }
  }

  async function uploadImage(file: File, opts: { postId?: string; draftId?: string }): Promise<UploadResult | null> {
    uploading.value = true; progress.value = 0; error.value = null;
    try {
      if (!file.type.startsWith('image/')) throw new Error('Unsupported file type');
      if (file.size > 2 * 1024 * 1024) throw new Error('File too large (>2MB)');

      const authed = await ensureAuthenticated();
      if (!authed) {
        addToast({ title: 'Sign In Required', message: 'Please sign in to upload images.', type: 'error', duration: 5000 });
        throw new Error('Unauthenticated');
      }

      const hash = await hashString(file.name + file.size + Date.now());
      const ext = file.name.split('.').pop() || 'img';
      const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g,'');
      const filename = `${Date.now()}-${hash}.${safeExt}`;
      const key = buildKey({ ...opts, filename });

      const input: UploadDataInput = {
        key,
        data: file,
        options: {
          contentType: file.type,
          accessLevel: 'public',
          // progressCallback: ({ transferredBytes, totalBytes }) => {
          //   if (totalBytes) progress.value = Math.round((transferredBytes/totalBytes)*100);
          // }
        }
      } as any;

      addToast({ title: 'Uploading Image', message: file.name, type: 'info', duration: 2500 });
      await uploadData(input).result;
  // public is default access level (configured in backend);
  const urlRes = await getUrl({ key });
      addToast({ title: 'Upload Complete', message: file.name, type: 'success', duration: 2500 });
      return { key, url: urlRes.url.toString() };
    } catch (e: any) {
      error.value = e.message || 'Upload failed';
      if (/403/.test(e.message) || e.name === 'UnauthorizedException') {
        addToast({ title: 'Upload Forbidden', message: 'You lack permission to upload (403). Ensure you are signed in and have write access.', type: 'error', duration: 7000 });
      } else if (error.value === 'Unauthenticated') {
        // already toasted above
      } else {
        addToast({ title: 'Upload Failed', message: error.value || 'Upload failed', type: 'error', duration: 6000 });
      }
      return null;
    } finally {
      uploading.value = false;
    }
  }

  async function resolveUrl(key: string) {
    try {
  const { url } = await getUrl({ key });
      return url.toString();
    } catch {
      return '';
    }
  }

  return {
    uploading,
    progress,
    error,
    uploadImage,
    resolveUrl
  };
}
