<template>
  <PageWrapper>
    <div class="profile-container">
      <header class="page-header">
        <div class="page-headings">
          <h1>User Profile</h1>
          <p>Manage your profile information and account settings.</p>
        </div>
      </header>
      <div class="profile-grid animate-grid">
        <!-- Personal Information Card -->
        <div class="profile-card" data-anim-index="0">
          <h2 class="card-title">Personal Information</h2>
          <div class="avatar-wrapper">
            <div class="avatar-preview" :class="{'has-avatar':hasAvatar}">
              <img v-if="hasAvatar" :src="profile.avatar" alt="User avatar" />
              <span v-else>No Avatar</span>
            </div>
            <div class="avatar-actions">
              <button type="button" class="avatar-btn" @click="selectAvatar">Upload</button>
              <button v-if="hasAvatar" type="button" class="avatar-btn danger" @click="profile.avatar=''">Remove</button>
              <input ref="avatarInput" type="file" accept="image/*" @change="onAvatarChange" style="display:none" />
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group" :class="{'invalid': errors.name}">
              <label for="name">Full Name</label>
              <input type="text" id="name" v-model="profile.name" :aria-invalid="!!errors.name" aria-describedby="name-error" />
              <div v-if="errors.name" id="name-error" class="error-msg" role="alert">{{ errors.name }}</div>
            </div>
            <div class="form-group" :class="{'invalid': errors.email}">
              <label for="email">Email Address</label>
              <input type="email" id="email" v-model="profile.email" :aria-invalid="!!errors.email" aria-describedby="email-error" />
              <div v-if="errors.email" id="email-error" class="error-msg" role="alert">{{ errors.email }}</div>
            </div>
            <div class="form-group">
              <label for="company">Company</label>
              <input type="text" id="company" v-model="profile.company" />
            </div>
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input type="tel" id="phone" v-model="profile.phone" />
            </div>
          </div>
        </div>
        <!-- Account Settings Card -->
        <div class="profile-card" data-anim-index="1">
          <h2 class="card-title">Account Settings</h2>
          <div class="form-grid narrow">
            <div class="form-group">
              <label for="timezone">Timezone</label>
              <div class="timezone-row">
                <select id="timezone" v-model="profile.timezone">
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="UTC">UTC</option>
                </select>
                <button type="button" @click="detectTimezone">Detect</button>
              </div>
            </div>
            <div class="form-group checkbox">
              <label>
                <input type="checkbox" v-model="profile.emailNotifications" />
                Receive email notifications
              </label>
            </div>
          </div>
        </div>
        <!-- Security Card -->
        <div class="profile-card security" data-anim-index="2">
          <h2 class="card-title">Security</h2>
          <div class="form-grid narrow">
            <div class="form-group">
              <label for="currentPassword">Current Password</label>
              <input type="password" id="currentPassword" v-model="security.currentPassword" autocomplete="current-password" />
            </div>
            <div class="form-group" :class="{'invalid': errors.newPassword}">
              <label for="newPassword">New Password</label>
              <input type="password" id="newPassword" v-model="security.newPassword" autocomplete="new-password" />
              <div v-if="errors.newPassword" class="error-msg" role="alert">{{ errors.newPassword }}</div>
            </div>
            <div class="form-group" :class="{'invalid': errors.confirmPassword}">
              <label for="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" v-model="security.confirmPassword" autocomplete="new-password" />
              <div v-if="errors.confirmPassword" class="error-msg" role="alert">{{ errors.confirmPassword }}</div>
            </div>
            <div class="divider" role="separator" aria-label="Password / MFA divider" />
            <!-- MFA Section -->
            <div class="mfa-section">
              <div class="mfa-header">
                <h3>MFA (TOTP)</h3>
                <span v-if="mfaEnabled" class="status-chip on" aria-label="MFA enabled">Enabled</span>
                <span v-else class="status-chip off" aria-label="MFA disabled">Disabled</span>
              </div>
              <p class="helper" v-if="!mfaEnabled && !mfaConfirming">Add an extra layer of security using an authenticator app.</p>
              <div v-if="!mfaEnabled && !mfaConfirming" class="mfa-actions">
                <button type="button" class="btn secondary" :disabled="mfaEnabling" @click="beginMfa">
                  <span v-if="!mfaEnabling">Enable MFA</span>
                  <span v-else>Preparing...</span>
                </button>
              </div>
              <div v-if="mfaConfirming" class="mfa-setup">
                <p>Scan the QR in your authenticator app (or use the secret below) then enter a 6‑digit code.</p>
                <div class="qr-secret">
                  <div class="qr-wrapper" v-if="qrDataUrl">
                    <img :src="qrDataUrl" alt="MFA QR Code" class="qr-image" />
                  </div>
                  <div class="secret-block">
                    <code>{{ mfaSecretDisplay }}</code>
                    <button type="button" class="mini-btn" @click="copySecret">Copy</button>
                  </div>
                </div>
                <div class="form-group code-entry" :class="{'invalid': mfaError}">
                  <label for="mfaCode">One-Time Code</label>
                  <input id="mfaCode" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" v-model="mfaCode" />
                  <div v-if="mfaError" class="error-msg" role="alert">{{ mfaError }}</div>
                </div>
                <div class="mfa-actions">
                  <button type="button" class="btn primary" :disabled="mfaConfirmingBusy" @click="confirmMfaCode">Confirm</button>
                  <button type="button" class="btn ghost" :disabled="mfaConfirmingBusy" @click="cancelMfaSetup">Cancel</button>
                </div>
              </div>
              <div v-if="mfaEnabled && !mfaConfirming" class="mfa-active">
                <details>
                  <summary>Show Backup Codes</summary>
                  <ul class="backup-codes">
                    <li v-for="c in mfaBackupCodes" :key="c"><code>{{ c }}</code></li>
                  </ul>
                </details>
                <div class="backup-actions">
                  <button type="button" class="mini-btn" @click="handleRegenerate" :disabled="regenBusy">{{ regenBusy ? 'Regenerating...' : 'Regenerate Codes' }}</button>
                  <div class="redeem-inline">
                    <input type="text" v-model="redeemInput" placeholder="Redeem code" class="redeem-input" />
                    <button type="button" class="mini-btn" @click="handleRedeem" :disabled="redeemBusy || !redeemInput">{{ redeemBusy ? 'Checking...' : 'Redeem' }}</button>
                  </div>
                  <div class="bulk-actions">
                    <button type="button" class="mini-btn" @click="copyAllCodes" :disabled="!mfaBackupCodes.length">Copy All</button>
                    <button type="button" class="mini-btn" @click="downloadCodes" :disabled="!mfaBackupCodes.length">Download</button>
                  </div>
                </div>
                <div class="mfa-actions">
                  <button type="button" class="btn danger" @click="disableMfa" :disabled="mfaDisabling">Disable MFA</button>
                </div>
              </div>
            </div>
          </div>
          <p class="helper">Password & MFA changes are applied securely. MFA verification is simulated locally until backend endpoint is implemented.</p>
        </div>
        <!-- Actions Card -->
        <div class="profile-card actions" data-anim-index="3">
            <h2 class="card-title">Actions</h2>
            <p class="helper">Save changes or reset to previously loaded values.</p>
            <div class="actions-row">
              <button type="button" class="btn primary" :disabled="isSaving" @click="saveProfile">
                <span v-if="!isSaving">Save Changes</span>
                <span v-else>Saving...</span>
              </button>
              <button type="button" class="btn ghost" :disabled="isSaving" @click="resetProfile">Reset</button>
            </div>
            <div v-if="isSaving" class="saving-indicator">Saving</div>
        </div>
      </div>
  <!-- Toasts handled globally by composable container -->
	<div class="sr-only" aria-live="polite"></div>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { downscaleImage } from '@/composables/useImageResize'
import { uploadData } from 'aws-amplify/storage'
import { useAuth } from '@/composables/useAuth'
import { getClient, withUserAuth } from '@/amplifyClient'
const { currentUser, changePassword, startMfaEnrollment, confirmMfa, disableMfa: authDisableMfa, mfaEnabled, mfaConfirming, mfaEnabling, mfaSecret, mfaOtpAuthUrl, mfaBackupCodes, mfaError, redeemBackupCode, regenerateBackupCodes } = useAuth()
const dataClient = getClient()
import { useToast } from '@/composables/useToast'

interface ProfileState { name:string; email:string; company:string; phone:string; timezone:string; emailNotifications:boolean; avatar:string }

const profile = ref<ProfileState>({
  name: 'John Doe',
  email: 'john@example.com',
  company: 'Tech Corp',
  phone: '+1 (555) 123-4567',
  timezone: 'America/New_York',
  emailNotifications: true,
  avatar: ''
})

// Avatar upload handling
const avatarInput = ref<HTMLInputElement | null>(null)
function selectAvatar(){ avatarInput.value?.click() }
async function onAvatarChange(e: Event){
  const files = (e.target as HTMLInputElement).files
  if(!files || !files[0]) return
  const file = files[0]
  if(!/^image\//.test(file.type)) { setToast('Unsupported file type','error'); return }
  try {
    const { dataUrl } = await downscaleImage(file, { maxSize: 256, mimeType: 'image/webp', quality: 0.85 })
    profile.value.avatar = dataUrl
    // Persist to Amplify Storage under protected path if user id available
    if(currentUser.value?.userId){
      const key = `avatars/${currentUser.value.userId}.webp`
      const base64 = dataUrl.split(',')[1]
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i)
      await uploadData({ key, data: bytes, options: { contentType: 'image/webp' } })
      setToast('Avatar saved','success')
    } else {
      setToast('Avatar updated (not saved – no user id)','warning' as any)
    }
  } catch (e:any) {
    setToast('Avatar processing failed','error')
  }
}

// Security state placeholders
const security = reactive({ currentPassword:'', newPassword:'', confirmPassword:'', mfaEnabled:false, saving:false })

// Validation state
const errors = reactive<Record<string,string>>({})
function validate(){
  errors.name = profile.value.name.trim() ? '' : 'Name is required.'
  errors.email = /.+@.+\..+/.test(profile.value.email) ? '' : 'Valid email required.'
  if(security.newPassword || security.confirmPassword){
    if(security.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters.'; else errors.newPassword=''
    errors.confirmPassword = security.newPassword === security.confirmPassword ? '' : 'Passwords do not match.'
  } else { errors.newPassword=''; errors.confirmPassword='' }
  return Object.values(errors).every(v=>!v)
}

// Toast composable
const { success: toastSuccess, error: toastError } = useToast()
function setToast(msg:string,type:'success'|'error'='success'){ type==='success'? toastSuccess(msg): toastError(msg) }

const isSaving = ref(false)

async function saveProfile() {
  if(!validate()){ setToast('Please fix validation errors','error'); return }
  isSaving.value = true
  try {
    if(currentUser.value){
      // Map to existing UserProfile fields: username (id), displayName, avatarUrl, bio/website optional.
      await dataClient.models.UserProfile.update({
        id: currentUser.value.userId,
        displayName: profile.value.name,
        avatarUrl: profile.value.avatar || undefined,
        // Additional custom fields (company, phone, timezone) would require model extension.
      }, withUserAuth())
    }
    setToast('Profile saved','success')
    resetSecurityFields()
  } catch(e:any){
    setToast('Save failed','error')
  } finally {
    isSaving.value = false
  }
}

function resetSecurityFields(){
  security.currentPassword=''
  security.newPassword=''
  security.confirmPassword=''
}

function resetProfile() {
  profile.value = { name: 'John Doe', email: 'john@example.com', company: 'Tech Corp', phone: '+1 (555) 123-4567', timezone: 'America/New_York', emailNotifications: true, avatar: '' }
  resetSecurityFields(); Object.keys(errors).forEach(k=> errors[k]=''); setToast('Reset complete','success')
}

async function submitPasswordChange(){
  if(!security.currentPassword || !security.newPassword){ setToast('Enter current and new password','error'); return }
  if(security.newPassword !== security.confirmPassword){ setToast('Passwords do not match','error'); return }
  try {
    security.saving = true
    await changePassword(security.currentPassword, security.newPassword)
    setToast('Password changed','success')
    resetSecurityFields()
  } catch(e:any){ setToast(e?.message || 'Change failed','error') } finally { security.saving=false }
}

async function setupMfa(){
  // Placeholder – would call Amplify Auth to set up TOTP and present QR code
  setToast('MFA setup flow coming soon','info' as any)
}

// MFA Integration
const mfaCode = ref('')
const mfaConfirmingBusy = ref(false)
const qrDataUrl = ref<string | null>(null)
const mfaDisabling = ref(false)
const regenBusy = ref(false)
const redeemBusy = ref(false)
const redeemInput = ref('')
function copyAllCodes(){
  if(!mfaBackupCodes.value.length) return
  try { navigator.clipboard.writeText(mfaBackupCodes.value.join('\n')); setToast('Codes copied','success') } catch { setToast('Copy failed','error') }
}
function downloadCodes(){
  if(!mfaBackupCodes.value.length) return
  const blob = new Blob([mfaBackupCodes.value.join('\n')+'\n'], { type:'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'backup-codes.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  setToast('Download started','success')
}

const mfaSecretDisplay = computed(()=> (mfaSecret.value||'').replace(/(.{4})/g,'$1 ').trim())

async function beginMfa(){
  try {
    await startMfaEnrollment()
    await generateQr()
  } catch(e:any){ setToast(e?.message || 'Failed to start MFA','error') }
}

async function generateQr(){
  if(!mfaOtpAuthUrl.value){ qrDataUrl.value = null; return }
  try {
  // @ts-ignore - qrcode types may not be installed
  const { toDataURL } = await import('qrcode')
    qrDataUrl.value = await toDataURL(mfaOtpAuthUrl.value, { width: 160, margin: 1 })
  } catch (e:any) {
    qrDataUrl.value = null
    setToast('QR generation failed','error')
  }
}

watch(mfaOtpAuthUrl, ()=> { generateQr() })

function cancelMfaSetup(){
  // Clear local in-progress state by resetting composable values manually (since we kept it simple)
  mfaSecret.value = null
  mfaCode.value = ''
  ;(mfaConfirming as any).value = false
  qrDataUrl.value = null
}

async function confirmMfaCode(){
  if(!/^\d{6}$/.test(mfaCode.value)){ setToast('Enter 6 digit code','error'); return }
  try {
    mfaConfirmingBusy.value = true
    await confirmMfa(mfaCode.value)
    setToast('MFA enabled','success')
  } catch(e:any){ setToast(e?.message || 'Failed to confirm','error') } finally { mfaConfirmingBusy.value=false }
}

async function disableMfa(){
  try {
    mfaDisabling.value = true
    await authDisableMfa()
    setToast('MFA disabled','success')
  } catch(e:any){ setToast(e?.message || 'Disable failed','error') } finally { mfaDisabling.value=false }
}

async function handleRegenerate(){
  try {
    if(!confirm('Regenerate backup codes? Existing codes will become invalid.')) return
    regenBusy.value = true
    const codes = await regenerateBackupCodes(10)
    if(codes.length){ setToast('Backup codes regenerated','success') } else { setToast('Failed to regenerate','error') }
  } finally { regenBusy.value=false }
}

async function handleRedeem(){
  if(!redeemInput.value) return
  try {
    redeemBusy.value = true
    const ok = await redeemBackupCode(redeemInput.value.trim())
    if(ok){ setToast('Code redeemed','success'); redeemInput.value='' } else { setToast('Invalid code','error') }
  } finally { redeemBusy.value=false }
}

function copySecret(){
  if(!mfaSecret.value) return
  try { navigator.clipboard.writeText(mfaSecret.value); setToast('Secret copied','success') } catch { setToast('Copy failed','error') }
}

// Auto-detect timezone
function detectTimezone(){
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    profile.value.timezone = tz
    setToast('Timezone set to '+tz,'success')
  } catch { setToast('Timezone detection failed','error') }
}

const hasAvatar = computed(()=> !!profile.value.avatar)

onMounted(()=>{ /* could fetch profile here */ })
</script>

<style scoped>
.profile-container { max-width:1100px; margin:0 auto; padding:1.5rem 1.25rem 3rem; }
.page-header { margin-bottom:1.5rem; background:transparent; }
.page-headings h1 { font-size:2.1rem; font-weight:600; margin:0 0 .4rem; letter-spacing:-0.5px; }
.page-headings p { font-size:.95rem; opacity:.75; margin:0; }

.profile-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); gap:1.25rem; align-items:start; }
.profile-card { background:var(--card-bg,#fff); border:1px solid rgba(0,0,0,0.08); border-radius:14px; padding:1.4rem 1.5rem 1.55rem; box-shadow:0 4px 18px -4px rgba(0,0,0,0.08); display:flex; flex-direction:column; gap:1.1rem; position:relative; }
.profile-card.actions { justify-content:flex-start; grid-column:1 / -1; order:99; }
.card-title { font-size:1.15rem; margin:0; font-weight:600; letter-spacing:.02em; }
.helper { font-size:.7rem; opacity:.55; margin:-.4rem 0 .2rem; }
.avatar-wrapper { display:flex; align-items:center; gap:1rem; }
.avatar-preview { width:72px; height:72px; border-radius:50%; background:#f1f5f9; border:2px solid rgba(0,0,0,0.08); overflow:hidden; display:flex; align-items:center; justify-content:center; font-size:.65rem; font-weight:600; color:#64748b; position:relative; }
.avatar-preview img { width:100%; height:100%; object-fit:cover; }
.avatar-actions { display:flex; flex-direction:column; gap:.4rem; }
.avatar-btn { font-size:.6rem; padding:.45rem .7rem; border-radius:6px; border:1px solid rgba(0,0,0,0.12); background:#fff; cursor:pointer; font-weight:600; letter-spacing:.03em; }
.avatar-btn:hover { background:#f1f5f9; }
.avatar-btn.danger { background:linear-gradient(90deg,#dc2626,#b91c1c); color:#fff; border:none; }
.avatar-btn.danger:hover { filter:brightness(1.05); }

.error-msg { color:#dc2626; font-size:.62rem; font-weight:600; letter-spacing:.04em; margin-top:-.25rem; }
.invalid input, .invalid select { border-color:#dc2626 !important; box-shadow:0 0 0 1px rgba(220,38,38,.4); }
.saving-indicator { position:absolute; top:.75rem; right:.85rem; font-size:.6rem; background:#2566af; color:#fff; padding:.3rem .55rem; border-radius:6px; animation:pulse 1s ease-in-out infinite; }
@keyframes pulse { 0%,100%{ opacity:1 } 50%{ opacity:.35 } }

.timezone-row { display:flex; gap:.6rem; align-items:center; }
.timezone-row button { font-size:.6rem; padding:.45rem .7rem; border-radius:6px; border:1px solid rgba(0,0,0,0.12); background:#fff; cursor:pointer; font-weight:600; }
.timezone-row button:hover { background:#f1f5f9; }

.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

/* Form grid */
.form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1rem 1.1rem; }
.form-grid.narrow { grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); }
.form-group { display:flex; flex-direction:column; gap:.45rem; }
.form-group.checkbox { flex-direction:row; align-items:center; }
.form-group label { font-size:.72rem; font-weight:600; letter-spacing:.05em; text-transform:uppercase; opacity:.8; }
.form-group input[type='text'],
.form-group input[type='email'],
.form-group input[type='tel'],
.form-group select { padding:.7rem .75rem; background:#fff; border:1px solid rgba(0,0,0,0.15); border-radius:8px; font-size:.8rem; transition:.25s border-color,.25s box-shadow; }
.form-group input:focus,
.form-group select:focus { outline:none; border-color:#2566af; box-shadow:0 0 0 2px rgba(37,102,175,0.25); }
.form-group input[type='checkbox'] { margin-right:.5rem; accent-color:#2566af; }

/* Buttons (shared style from Preferences) */
.actions-row { display:flex; gap:.6rem; flex-wrap:wrap; }
.btn { font-family:inherit; font-size:.72rem; padding:.6rem .95rem; border-radius:8px; border:1px solid rgba(0,0,0,0.12); background:#ffffff; cursor:pointer; font-weight:600; letter-spacing:.03em; line-height:1; display:inline-flex; align-items:center; gap:.4rem; transition:.25s background,.25s color,.25s border-color,.25s box-shadow,.25s transform; color:#0f172a; }
.btn.primary { background:linear-gradient(90deg,#2566af,#1d4f91); color:#fff; border:none; }
.btn.primary:hover { filter:brightness(1.05); }
.btn.ghost { background:linear-gradient(180deg,#f9fafb,#f1f5f9); border-color:rgba(0,0,0,0.08); }
.btn.ghost:hover { background:linear-gradient(180deg,#ffffff,#f1f5f9); box-shadow:0 2px 4px rgba(0,0,0,0.08); }
.btn:focus-visible { outline:2px solid #2566af; outline-offset:2px; }
.btn:active { transform:translateY(0); box-shadow:0 1px 2px rgba(0,0,0,0.2) inset; }

/* Animation */
.animate-grid { --stagger:110ms; }
.animate-grid .profile-card { opacity:0; transform:translateY(14px); animation:cardIn .65s cubic-bezier(.4,0,.2,1) forwards; }
.animate-grid .profile-card[data-anim-index="0"] { animation-delay:calc(var(--stagger)*0); }
.animate-grid .profile-card[data-anim-index="1"] { animation-delay:calc(var(--stagger)*1); }
.animate-grid .profile-card[data-anim-index="2"] { animation-delay:calc(var(--stagger)*2); }
.animate-grid .profile-card[data-anim-index="3"] { animation-delay:calc(var(--stagger)*3); }
@keyframes cardIn { to { opacity:1; transform:translateY(0); } }

/* Dark mode */
[data-theme='dark'] .profile-card { background:#1f2937; border-color:rgba(255,255,255,0.14); box-shadow:0 4px 18px -4px rgba(0,0,0,0.55); }
[data-theme='dark'] .card-title { color:#64b5f6; }
[data-theme='dark'] .avatar-preview { background:#243049; border-color:rgba(255,255,255,0.15); color:#94a3b8; }
[data-theme='dark'] .avatar-btn { background:#1e293b; border-color:rgba(255,255,255,0.18); color:#e2e8f0; }
[data-theme='dark'] .avatar-btn:hover { background:#32415b; }
[data-theme='dark'] .timezone-row button { background:#1e293b; border-color:rgba(255,255,255,0.18); color:#e2e8f0; }
[data-theme='dark'] .timezone-row button:hover { background:#32415b; }
[data-theme='dark'] .form-group input[type='text'],
[data-theme='dark'] .form-group input[type='email'],
[data-theme='dark'] .form-group input[type='tel'],
[data-theme='dark'] .form-group select { background:#1e293b; border-color:rgba(255,255,255,0.18); color:#e2e8f0; }
[data-theme='dark'] .form-group input:focus,
[data-theme='dark'] .form-group select:focus { border-color:#64b5f6; box-shadow:0 0 0 2px rgba(100,181,246,0.35); }
[data-theme='dark'] .btn { background:#1e293b; border-color:rgba(255,255,255,0.18); color:#e2e8f0; }
[data-theme='dark'] .btn.primary { background:linear-gradient(90deg,#2566af,#1d4f91); }
[data-theme='dark'] .btn.ghost { background:linear-gradient(180deg,#243049,#1e293b); }
[data-theme='dark'] .btn.ghost:hover { background:linear-gradient(180deg,#2f3d54,#243049); }
</style>
