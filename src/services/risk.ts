// Risk scoring helpers: map CVSS vector to coarse likelihood & impact level, then combine to severity.
// This is a heuristic; adjust thresholds or matrices as needed.

export type LikelihoodLevel = 'VERY_LOW'|'LOW'|'MEDIUM'|'HIGH'|'VERY_HIGH'
export type ImpactLevel = 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'
export type Severity = 'INFO'|'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'

interface CvssLikeResult { baseScore?: number; severity?: Severity }

// Lazy import to avoid circular deps. Caller can pass calculation function.
// We'll dynamically import existing cvss service if available.
async function calcCvss(vector: string): Promise<CvssLikeResult | null> {
  if (!vector) return null;
  try {
    const mod = await import('./cvss');
    const res = mod.calculate(vector);
    if (!res) return null;
    return { baseScore: res.score, severity: res.severity } as any;
  } catch { return null; }
}

export function impactFromCvssBase(score: number | undefined): ImpactLevel | undefined {
  if (score == null) return undefined;
  if (score >= 9) return 'CRITICAL';
  if (score >= 7) return 'HIGH';
  if (score >= 4) return 'MEDIUM';
  return 'LOW';
}

export function likelihoodFromVector(vector: string | undefined): LikelihoodLevel | undefined {
  if (!vector) return undefined;
  // Simple heuristic mapping based on base metrics tokens.
  // More remote / complex / high privileges reduce likelihood.
  const segs = vector.split('/');
  const get = (k: string) => segs.find(s=>s.startsWith(k+':'))?.split(':')[1];
  const av = get('AV'); // Network (N), Adjacent (A), Local (L), Physical (P)
  const ac = get('AC'); // L/H
  const pr = get('PR'); // N/L/H
  const ui = get('UI'); // N/R
  let score = 0;
  if (av === 'N') score += 3; else if (av === 'A') score += 2; else if (av === 'L') score += 1; // Physical 0
  if (ac === 'L') score += 2; // High adds 0
  if (pr === 'N') score += 2; else if (pr === 'L') score += 1;
  if (ui === 'N') score += 2; // Required adds 0
  // score range 0-9 roughly.
  if (score >= 8) return 'VERY_HIGH';
  if (score >= 6) return 'HIGH';
  if (score >= 4) return 'MEDIUM';
  if (score >= 2) return 'LOW';
  return 'VERY_LOW';
}

// Severity matrix using likelihood vs impact level
const severityMatrix: Record<ImpactLevel, Record<LikelihoodLevel, Severity>> = {
  CRITICAL: { VERY_HIGH:'CRITICAL', HIGH:'CRITICAL', MEDIUM:'HIGH', LOW:'HIGH', VERY_LOW:'MEDIUM' },
  HIGH:     { VERY_HIGH:'HIGH', HIGH:'HIGH', MEDIUM:'HIGH', LOW:'MEDIUM', VERY_LOW:'LOW' },
  MEDIUM:   { VERY_HIGH:'HIGH', HIGH:'MEDIUM', MEDIUM:'MEDIUM', LOW:'LOW', VERY_LOW:'LOW' },
  LOW:      { VERY_HIGH:'MEDIUM', HIGH:'MEDIUM', MEDIUM:'LOW', LOW:'LOW', VERY_LOW:'INFO' },
};

export function severityFrom(impact: ImpactLevel, likelihood: LikelihoodLevel): Severity {
  return severityMatrix[impact][likelihood];
}

export async function deriveRiskFromCvss(vector: string | undefined) {
  if (!vector) return { likelihood: undefined, impactLevel: undefined };
  const res = await calcCvss(vector);
  if (!res || res.baseScore == null) return { likelihood: undefined, impactLevel: undefined };
  return {
    likelihood: likelihoodFromVector(vector),
    impactLevel: impactFromCvssBase(res.baseScore)
  };
}

export interface DerivedSeverityResult {
  severity: Severity;
  impactLevel: ImpactLevel;
  likelihood: LikelihoodLevel;
}

export function computeSeverityWithFallback(opts: { impactLevel?: ImpactLevel; likelihood?: LikelihoodLevel; cvssVector?: string }) {
  let { impactLevel, likelihood } = opts;
  if (!impactLevel && !likelihood && opts.cvssVector) {
    // Attempt synchronous estimation without async cvss calc (rough parse).
    impactLevel = impactLevel || 'MEDIUM';
  }
  if (!impactLevel || !likelihood) return undefined;
  return severityFrom(impactLevel, likelihood);
}
