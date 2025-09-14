// Simple error normalization helper for composables
export interface NormalizedError {
  message: string
  cause?: any
  code?: string
}

export function normalizeError(err: unknown, fallback = 'Unexpected error'): NormalizedError {
  if (!err) return { message: fallback }
  if (typeof err === 'string') return { message: err }
  if (err instanceof Error) {
    return { message: err.message || fallback, cause: (err as any).cause, code: (err as any).code }
  }
  if (typeof err === 'object') {
    const anyErr = err as any
    return { message: anyErr.message || fallback, cause: anyErr }
  }
  return { message: fallback }
}
