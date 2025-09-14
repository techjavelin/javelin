import { useToasts } from './useToasts'

interface ApiErrorShape {
  error?: string | { message?: string }
  errors?: any
  message?: string
}

export interface WithErrorToastOptions {
  /** Override generic failure title */
  title?: string
  /** Provide a friendlier fallback message */
  fallbackMessage?: string
  /** Suppress toast emission but still throw */
  suppressToast?: boolean
  /** Treat a falsy (null/undefined) result as error */
  disallowNull?: boolean
}

/**
 * Wrap any promise-returning API call and surface failures consistently via toast + thrown Error.
 * Also inspects GraphQL-like { errors: [...] } or REST { error: "" } bodies even on HTTP 200.
 */
export function useApi() {
  const { add: addToast } = useToasts()

  async function withErrorToast<T>(label: string, fn: () => Promise<T>, opts: WithErrorToastOptions = {}): Promise<T> {
    try {
      const result = await fn()

      // If result is a Response (fetch) normalize
      if (result instanceof Response) {
        let parsed: any = null
        let clone: Response = result
        try {
          clone = result.clone()
          parsed = await clone.json().catch(() => null)
        } catch {
          // ignore parse errors; treat as raw
        }

        // Detect explicit error envelope on 2xx
        if (result.ok) {
          if (parsed && typeof parsed === 'object') {
            if (hasErrorEnvelope(parsed)) {
              throw makeApiError(label, parsed)
            }
          }
          return result as unknown as T
        }

        // Non-OK HTTP
        const errPayload: ApiErrorShape | null = parsed && typeof parsed === 'object' ? parsed : null
        const message = extractMessage(errPayload) || opts.fallbackMessage || `${label} failed`
        throw new Error(message)
      }

      // Plain object / value branch: attempt envelope inspection
      if (result && typeof result === 'object') {
        if (hasErrorEnvelope(result as any)) {
          throw makeApiError(label, result as any)
        }
      }

      if (opts.disallowNull && (result === null || result === undefined)) {
        throw new Error(opts.fallbackMessage || `${label} returned empty result`)
      }

      return result
    } catch (err: any) {
      let message = friendlyMessage(label, err, opts)
      // Detect fetch TypeError (common for CORS/network). Browser sets err.name = 'TypeError' and message like 'Failed to fetch'
      if (err && err.name === 'TypeError' && /fetch/i.test(err.message || '')) {
        message = `${label} failed: network or CORS error. If calling a custom API ensure CORS headers and allowed origin are configured.`
      }
      if (!opts.suppressToast) {
        addToast({
          title: opts.title || `${label} Error`,
          message,
          type: 'error',
          duration: 6000
        })
      }
      // Re-throw for caller specific handling if needed
      throw err instanceof Error ? err : new Error(message)
    }
  }

  return { withErrorToast }
}

function hasErrorEnvelope(obj: any): boolean {
  if (!obj) return false
  if (Array.isArray(obj.errors) && obj.errors.length > 0) return true
  if (obj.error && typeof obj.error === 'string') return true
  if (obj.error && typeof obj.error === 'object' && (obj.error.message || Object.keys(obj.error).length > 0)) return true
  return false
}

function extractMessage(errShape?: ApiErrorShape | null): string | undefined {
  if (!errShape) return undefined
  if (typeof errShape.error === 'string') return errShape.error
  if (errShape.error && typeof errShape.error === 'object' && errShape.error.message) return errShape.error.message
  if (errShape.message) return errShape.message
  if (Array.isArray(errShape.errors)) {
    const first = errShape.errors[0]
    if (first) {
      if (typeof first === 'string') return first
      if (first.message) return first.message
    }
  }
  return undefined
}

function makeApiError(label: string, payload: any): Error {
  const msg = extractMessage(payload) || `${label} failed`
  const e = new Error(msg)
  ;(e as any).payload = payload
  return e
}

function friendlyMessage(label: string, err: any, opts: WithErrorToastOptions): string {
  if (!err) return opts.fallbackMessage || `${label} failed`
  if (err instanceof Error) return err.message || opts.fallbackMessage || `${label} failed`
  if (typeof err === 'string') return err
  if (typeof err === 'object') {
    const msg = extractMessage(err as ApiErrorShape)
    if (msg) return msg
  }
  return opts.fallbackMessage || `${label} failed`
}
