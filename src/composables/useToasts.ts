import { ref } from 'vue';

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // ms
  dismissible?: boolean;
}

export interface Toast extends Required<Omit<ToastOptions, 'id'>> { id: string; createdAt: number; }

const toasts = ref<Toast[]>([]);

let seed = 0;

function add(toast: ToastOptions) {
  const id = toast.id || `t_${Date.now()}_${seed++}`;
  const t: Toast = {
    id,
    title: toast.title || '',
    message: toast.message,
    type: toast.type || 'info',
    duration: toast.duration ?? 4500,
    dismissible: toast.dismissible ?? true,
    createdAt: Date.now()
  };
  toasts.value = [...toasts.value, t];
  if (t.duration > 0) {
    setTimeout(() => remove(id), t.duration + 50);
  }
  return id;
}

function remove(id: string) {
  toasts.value = toasts.value.filter(t => t.id !== id);
}

function clear() {
  toasts.value = [];
}

export function useToasts() {
  return { toasts, add, remove, clear };
}
