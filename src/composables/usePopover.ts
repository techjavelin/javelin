import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

export interface UsePopoverOptions {
  closeOnEsc?: boolean
  closeOnOutside?: boolean
  outsideCapture?: boolean
}

export function usePopover(triggerEl: Ref<HTMLElement | null>, opts: UsePopoverOptions = {}) {
  const { closeOnEsc = true, closeOnOutside = true, outsideCapture = true } = opts
  const open = ref(false)
  function toggle(){ open.value = !open.value }
  function close(){ open.value && (open.value = false) }

  function onDocClick(e: MouseEvent){
    if(!closeOnOutside || !open.value) return
    const t = e.target as Node
    if(triggerEl.value && !triggerEl.value.contains(t)) close()
  }
  function onEsc(e: KeyboardEvent){ if(closeOnEsc && e.key==='Escape') close() }

  onMounted(()=>{
    if(closeOnOutside) document.addEventListener('click', onDocClick, outsideCapture)
    if(closeOnEsc) document.addEventListener('keydown', onEsc)
  })
  onBeforeUnmount(()=>{
    if(closeOnOutside) document.removeEventListener('click', onDocClick, outsideCapture)
    if(closeOnEsc) document.removeEventListener('keydown', onEsc)
  })

  return { open, toggle, close }
}
