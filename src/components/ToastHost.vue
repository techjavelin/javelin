<template>
  <div class="toast-host" role="status" aria-live="polite">
    <transition-group name="toast-fade" tag="div" class="toast-stack">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`toast-${t.type}`"
        :aria-label="t.title || t.type"
      >
        <div class="toast-content">
          <div class="toast-text">
            <strong v-if="t.title" class="toast-title">{{ t.title }}</strong>
            <span class="toast-message">{{ t.message }}</span>
          </div>
          <button v-if="t.dismissible" class="toast-close" @click="remove(t.id)" aria-label="Dismiss">
            &times;
          </button>
        </div>
        <div class="toast-progress" v-if="t.duration > 0">
          <div class="bar" :style="{ animationDuration: t.duration + 'ms' }"></div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useToasts } from '../composables/useToasts';
const { toasts, remove } = useToasts();
</script>

<style scoped>
.toast-host { position: fixed; top: 1.1rem; right: 1.1rem; z-index: 4000; display:flex; flex-direction:column; gap:0.75rem; }
.toast-stack { display:flex; flex-direction:column; gap:0.75rem; }
.toast { min-width: 260px; max-width: 360px; background: var(--color-card-light); border:1px solid var(--color-border); border-radius:14px; padding: 0.85rem 0.95rem 0.7rem; box-shadow:0 4px 18px -2px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05); font-size:0.8rem; line-height:1.25; position:relative; overflow:hidden; }
[data-theme="dark"] .toast { background:#1f2735; border-color:#2c3848; box-shadow:0 6px 28px -4px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04); }
.toast-success { border-color:#16a34a; }
.toast-error { border-color:#dc2626; }
.toast-warning { border-color:#f59e0b; }
.toast-info { border-color:#3b82f6; }
.toast-content { display:flex; gap:0.75rem; align-items:flex-start; }
.toast-title { display:block; font-weight:600; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:0.15rem; }
.toast-message { display:block; }
.toast-close { background:transparent; border:none; cursor:pointer; color:inherit; font-size:1rem; line-height:1; padding:0 0.25rem; border-radius:6px; }
.toast-close:hover { background:rgba(0,0,0,0.06); }
[data-theme="dark"] .toast-close:hover { background:rgba(255,255,255,0.09); }
.toast-progress { height:3px; background:transparent; position:absolute; left:0; right:0; bottom:0; }
.toast-progress .bar { height:100%; width:100%; background: linear-gradient(90deg,var(--color-primary), var(--color-accent,#6366f1)); animation: shrink linear forwards; transform-origin:left center; }
.toast-success .toast-progress .bar { background:#16a34a; }
.toast-error .toast-progress .bar { background:#dc2626; }
.toast-warning .toast-progress .bar { background:#f59e0b; }
.toast-info .toast-progress .bar { background:#3b82f6; }
@keyframes shrink { from { transform:scaleX(1); } to { transform:scaleX(0); } }
.toast-fade-enter-from { opacity:0; transform: translateY(-6px) scale(.96); }
.toast-fade-enter-to { opacity:1; transform: translateY(0) scale(1); }
.toast-fade-leave-from { opacity:1; height:auto; margin:0.75rem 0; }
.toast-fade-leave-to { opacity:0; height:0; margin:0; transform: translateY(-6px) scale(.96); }
.toast-fade-enter-active { transition: all .22s cubic-bezier(.4,.0,.2,1); }
.toast-fade-leave-active { transition: all .18s ease, height .24s ease, margin .24s ease; }
</style>
