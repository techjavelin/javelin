<template>
  <div class="modal-backdrop" @click.self="onClose">
    <div class="modal-content">
      <button class="modal-close" @click="onClose">&times;</button>
      <h2>Request Early Access</h2>
      <form @submit.prevent="onSubmit">
        <div class="form-row">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" required />
        </div>
        <div class="form-row">
          <label for="orgName">Organization Name</label>
          <input id="orgName" v-model="organizationName" required />
        </div>
        <div class="form-row">
          <label for="industry">Industry</label>
          <input id="industry" v-model="industry" required />
        </div>
        <div class="form-row">
          <label for="reason">Why would you like to join?</label>
          <textarea id="reason" v-model="reason" required rows="3"></textarea>
        </div>
        <button class="cta-btn cta-primary" type="submit" :disabled="loading">Request Invite</button>
      </form>
      <div v-if="success" class="invite-success">Thank you! Your request has been submitted.</div>
      <div v-if="error" class="invite-error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { usePulseInviteSubmission } from '@/composables/usePulseInviteSubmission'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['close'])

const email = ref('')
const organizationName = ref('')
const industry = ref('')
const reason = ref('')

const { submitInvite, loading, error, success } = usePulseInviteSubmission()

function onClose() {
  emit('close')
}

async function onSubmit() {
  await submitInvite({ email: email.value, organizationName: organizationName.value, industry: industry.value, reason: reason.value })
  if (success.value) {
    email.value = ''
    organizationName.value = ''
    industry.value = ''
    reason.value = ''
  }
}

watch(() => props.show, (val) => {
  if (!val) {
    email.value = ''
    organizationName.value = ''
    industry.value = ''
    reason.value = ''
  }
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(30, 41, 59, 0.65);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 16px rgba(30,64,175,0.18);
  padding: 2.5rem 2rem 2rem 2rem;
  max-width: 420px;
  width: 100%;
  position: relative;
}
.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  color: #64748b;
  cursor: pointer;
}
.form-row {
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
}
.form-row label {
  font-weight: 600;
  margin-bottom: 0.4rem;
}
.form-row input,
.form-row textarea {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  font-size: 1rem;
}
.invite-success {
  color: #059669;
  margin-top: 1rem;
  font-weight: 600;
}
.invite-error {
  color: #e53935;
  margin-top: 1rem;
  font-weight: 600;
}
.cta-btn {
  display: inline-block;
  margin: 1rem 0.5rem 0 0.5rem;
  padding: 0.9rem 2.2rem;
  border-radius: 6px;
  font-weight: 700;
  text-decoration: none;
  font-size: 1.1rem;
  transition: background 0.2s, color 0.2s;
}
.cta-primary {
  background: #2563eb;
  color: #fff;
}
.cta-primary:hover {
  background: #1e40af;
}

/* Dark theme overrides */
:global([data-theme="dark"]) .modal-backdrop {
  background: rgba(0,0,0,0.75);
}

:global([data-theme="dark"]) .modal-content {
  background: #1e1e1e;
  color: #e0e0e0;
  box-shadow: 0 4px 28px rgba(0,0,0,0.6), 0 0 0 1px #333;
  border: 1px solid #333;
}

:global([data-theme="dark"]) .modal-content h2 {
  color: #f5f5f5;
}

:global([data-theme="dark"]) .modal-close {
  color: #a0afc0;
}
:global([data-theme="dark"]) .modal-close:hover {
  color: #64b5f6;
}

:global([data-theme="dark"]) .form-row label {
  color: #cfd8dc;
}

:global([data-theme="dark"]) .form-row input,
:global([data-theme="dark"]) .form-row textarea {
  background: #2a2a2a;
  border-color: #444;
  color: #e0e0e0;
}
:global([data-theme="dark"]) .form-row input:focus,
:global([data-theme="dark"]) .form-row textarea:focus {
  border-color: #64b5f6;
  box-shadow: 0 0 0 2px rgba(100, 181, 246, 0.25);
  outline: none;
}

:global([data-theme="dark"]) .invite-success {
  color: #10b981;
}
:global([data-theme="dark"]) .invite-error {
  color: #ef5350;
}

:global([data-theme="dark"]) .cta-primary {
  background: #2566af;
  color: #fff;
  border: 1px solid #2566af;
}
:global([data-theme="dark"]) .cta-primary:hover {
  background: #1e4f86;
}

:global([data-theme="dark"]) .cta-btn[disabled],
:global([data-theme="dark"]) .cta-btn:disabled {
  background: #2d2d2d;
  color: #666;
  border-color: #2d2d2d;
  cursor: not-allowed;
}
</style>
