export type ProgressionType = 'WEIGHT_REPS' | 'HOLD_SECONDS' | 'REPS_ONLY'
export type MassUnit = 'KG' | 'LBS'
export type WeightUnit = 'DEFAULT' | MassUnit

export function prettyType(t: ProgressionType): string {
  switch (t) {
    case 'WEIGHT_REPS':
      return 'Weight + Reps'
    case 'HOLD_SECONDS':
      return 'Hold (seconds)'
    case 'REPS_ONLY':
      return 'Reps only'
    default:
      return t
  }
}

export function massLabel(u: MassUnit): string {
  return u === 'KG' ? 'kg' : 'lbs'
}

export function parseTimeToSec(str: string): number | null {
  if (!str) return null
  const parts = String(str).split(':').map(Number)
  if (parts.some(Number.isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 1) return parts[0]
  return null
}


