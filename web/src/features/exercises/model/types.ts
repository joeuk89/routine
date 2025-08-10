import type { ProgressionType, WeightUnit } from '@/lib/units'

export type Exercise = {
  id: string
  name: string
  color: string
  type: ProgressionType
  refUrl?: string
  weightUnit?: WeightUnit
}


