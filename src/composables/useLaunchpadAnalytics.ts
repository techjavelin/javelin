import { ref } from 'vue'

interface LaunchpadEvent {
  module: string
  action: 'launch' | 'learn'
  timestamp: number
  meta?: Record<string, any>
}

const buffer = ref<LaunchpadEvent[]>([])

export function useLaunchpadAnalytics() {
  function record(module: string, action: LaunchpadEvent['action'], meta?: Record<string, any>) {
    const evt: LaunchpadEvent = { module, action, meta, timestamp: Date.now() }
    buffer.value.push(evt)
    // Placeholder: replace with real telemetry pipeline (e.g., Amazon Pinpoint, custom API, Segment)
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[launchpad-analytics]', evt)
    }
  }

  function drain() {
    const copy = [...buffer.value]
    buffer.value = []
    return copy
  }

  return { record, drain }
}