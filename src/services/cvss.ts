// Minimal CVSS v3.1 base score calculator (subset) for UI usage.
// Supports metrics: AV, AC, PR, UI, S, C, I, A
// Returns { score, severity }

export interface CvssResult { score: number; severity: string }

const AV = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 }
const AC = { L: 0.77, H: 0.44 }
const PRU = { N: 0.85, L: 0.62, H: 0.27 } // Scope Unchanged
const PRC = { N: 0.85, L: 0.68, H: 0.5 }  // Scope Changed
const UI = { N: 0.85, R: 0.62 }
const CIA = { H: 0.56, L: 0.22, N: 0 }

export function parseVector(vector: string) {
  const parts = vector.split('/').map(p=>p.trim()).filter(Boolean)
  const obj: Record<string,string> = {}
  for (const p of parts) {
    const [k,v] = p.split(':')
    if (k && v) obj[k] = v
  }
  return obj
}

export function calculate(vector: string): CvssResult | null {
  if (!vector) return null
  const v = parseVector(vector)
  if (!v.AV || !v.AC || !v.PR || !v.UI || !v.S || !v.C || !v.I || !v.A) return null
  try {
    const scopeChanged = v.S === 'C'
    const prTable = scopeChanged ? PRC : PRU
    const exploitab = 8.22 * AV[v.AV as keyof typeof AV] * AC[v.AC as keyof typeof AC] * prTable[v.PR as keyof typeof prTable] * UI[v.UI as keyof typeof UI]
    const impactSub = 1 - ((1 - CIA[v.C as keyof typeof CIA]) * (1 - CIA[v.I as keyof typeof CIA]) * (1 - CIA[v.A as keyof typeof CIA]))
    const impact = (scopeChanged ? 7.52 * (impactSub - 0.029) - 3.25 * (impactSub - 0.02) ** 15 : 6.42 * impactSub)
    const base = impact <= 0 ? 0 : (scopeChanged ? Math.min(1.08 * (impact + exploitab), 10) : Math.min(impact + exploitab, 10))
    const score = Math.ceil(base * 10) / 10
    const severity = score === 0 ? 'NONE' : score < 4 ? 'LOW' : score < 7 ? 'MEDIUM' : score < 9 ? 'HIGH' : 'CRITICAL'
    return { score, severity }
  } catch {
    return null
  }
}

export function nextVector(current: string, metric: string, value: string) {
  const v = parseVector(current)
  v[metric] = value
  // Ensure ordering for readability
  const order = ['AV','AC','PR','UI','S','C','I','A']
  return order.filter(k=>v[k]).map(k=>`${k}:${v[k]}`).join('/')
}
