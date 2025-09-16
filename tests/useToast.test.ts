import { describe, it, expect, vi } from 'vitest'
import { useToast } from '@/composables/useToast'

// Basic unit tests for toast composable

describe('useToast composable', () => {
  it('pushes and auto-dismisses a success toast', async () => {
    const { success, toasts } = useToast()
    const id = success('Yay', 10) // very short duration
    expect(toasts.value.find(t=> t.id === id)?.message).toBe('Yay')
    // Advance timers
    await new Promise(res=> setTimeout(res, 15))
    expect(toasts.value.find(t=> t.id === id)).toBeUndefined()
  })

  it('manually dismisses a toast', () => {
    const { push, dismiss, toasts } = useToast()
    const id = push({ message: 'Keep me', duration: 0 })
    expect(toasts.value.some(t=> t.id === id)).toBe(true)
    dismiss(id)
    expect(toasts.value.some(t=> t.id === id)).toBe(false)
  })

  it('adds different toast types', () => {
    const { success, error, info, warning, toasts } = useToast()
    success('S')
    error('E')
    info('I')
    warning('W')
    const types = toasts.value.map(t=> t.type)
    expect(types).toContain('success')
    expect(types).toContain('error')
    expect(types).toContain('info')
    expect(types).toContain('warning')
  })
})
