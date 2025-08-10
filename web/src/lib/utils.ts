import type { Exercise } from '@/features/exercises/model/types'
import type { AppSettings } from '@/features/settings/model/settings'
import type { MassUnit } from './units'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'



export function getUnitForExercise(exercise: Exercise, settings: AppSettings): MassUnit {
  if (exercise.type !== 'WEIGHT_REPS') return settings.defaultUnit
  if (!exercise.weightUnit || exercise.weightUnit === 'DEFAULT') return settings.defaultUnit
  return exercise.weightUnit as MassUnit
}

export function cn(...inputs: Array<string | undefined | null | false>) {
  return twMerge(clsx(inputs))
}


