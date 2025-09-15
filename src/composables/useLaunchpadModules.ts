import { computed } from 'vue'
import { useAuth } from './useAuth'
import { useLaunchpadAnalytics } from './useLaunchpadAnalytics'

export interface LaunchpadModuleDef {
  key: string
  title: string
  description: string
  icon?: string
  status?: string
  statusVariant?: 'default' | 'beta' | 'new' | 'soon'
  canLaunch: () => boolean
  launch: () => void
  learn?: () => void
}

export function useLaunchpadModules() {
  const { userGroups } = useAuth()
  const { record } = useLaunchpadAnalytics()

  function go(url: string, newTab = false) {
    if (newTab) window.open(url, '_blank')
    else window.location.href = url
  }

  const modules = computed<LaunchpadModuleDef[]>(() => [
    {
      key: 'sigint',
      title: 'SigInt',
      description: 'Signals Intelligence (SigInt) provides advanced monitoring, threat detection, and intelligence gathering capabilities for your organization. Use SigInt to stay ahead of emerging threats and gain actionable insights.',
      icon: '📡',
      status: 'Beta',
      statusVariant: 'beta',
      canLaunch: () => userGroups.value.includes('pulse-sigint') || userGroups.value.includes('admin'),
      launch: () => { record('sigint','launch'); go('/sigint') },
      learn: () => { record('sigint','learn'); go('/pulse/sigint') }
    },
    {
      key: 'pentester',
      title: 'Pentester Portal',
      description: 'Central workspace for security testing: manage engagements, submit findings, track artifacts, and access the vulnerability knowledge base. Streamlines collaboration between offensive security and program owners.',
      icon: '🛡️',
      status: 'Live',
      statusVariant: 'new',
      canLaunch: () => userGroups.value.includes('pentester') || userGroups.value.includes('admin'),
      launch: () => { record('pentester','launch'); go('/pentester') },
      learn: () => { record('pentester','learn'); go('https://docs.pulse.techjavelin.com/pentester', true) }
    }
  ])

  return { modules }
}

export type UseLaunchpadModulesReturn = ReturnType<typeof useLaunchpadModules>