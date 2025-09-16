import { ref, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'
export interface ToastOptions { id?: string; message: string; type?: ToastType; duration?: number }
interface ToastState extends Required<Omit<ToastOptions,'id'>> { id: string }

const toasts = ref<ToastState[]>([])
let counter = 0

function push(options: ToastOptions) {
  const id = options.id || `t_${Date.now()}_${counter++}`
  const toast: ToastState = {
    id,
    message: options.message,
    type: options.type || 'info',
    duration: options.duration ?? 4000
  }
  toasts.value.push(toast)
  if (toast.duration > 0) {
    setTimeout(() => dismiss(id), toast.duration)
  }
  return id
}

function dismiss(id: string) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

function success(message: string, duration?: number) { return push({ message, type: 'success', duration }) }
function error(message: string, duration?: number) { return push({ message, type: 'error', duration }) }
function info(message: string, duration?: number) { return push({ message, type: 'info', duration }) }
function warning(message: string, duration?: number) { return push({ message, type: 'warning', duration }) }

export function useToast() {
  return { toasts: readonly(toasts), push, dismiss, success, error, info, warning }
}

// Provide a small render helper (optional consumption pattern)
export function mountToastContainerRootAttrs() {
  return {
    'aria-live': 'polite',
    role: 'status'
  }
}
