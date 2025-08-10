import type { Exercise } from '@/features/exercises/model/types'
import type { LogEntry } from '@/features/logs/model/log'
import type { MassUnit } from './units'
import { massLabel, parseTimeToSec } from './units'

export function latestLogForExercise(logs: LogEntry[], exerciseId: string): LogEntry | undefined {
  const arr = logs.filter((l) => l.exerciseId === exerciseId)
  if (!arr.length) return undefined
  return arr.reduce((a, b) => (a.dateISO > b.dateISO ? a : b))
}

export function latestLogForExerciseBeforeDate(logs: LogEntry[], exerciseId: string, beforeDateISO: string): LogEntry | undefined {
  const arr = logs.filter((l) => l.exerciseId === exerciseId && l.dateISO < beforeDateISO)
  if (!arr.length) return undefined
  return arr.reduce((a, b) => (a.dateISO > b.dateISO ? a : b))
}

export function getLogForExerciseOnDate(logs: LogEntry[], exerciseId: string, dateISO: string): LogEntry | undefined {
  return logs.find((l) => l.exerciseId === exerciseId && l.dateISO === dateISO)
}

export function getCurrentProgressDetails(exercise: Exercise, log: LogEntry | undefined, unit: MassUnit): string[] {
  if (!log) return []
  const p = log.payload || {}
  const sets = p.sets || []
  if (!sets.length) return []
  
  switch (exercise.type) {
    case 'WEIGHT_REPS': {
      return sets.map((set: any, index: number) => 
        `Set ${index + 1}: ${set.reps} × ${set.weight}${massLabel(unit)}`
      )
    }
    case 'HOLD_SECONDS': {
      return sets.map((set: any, index: number) => 
        `Set ${index + 1}: ${set.seconds}s`
      )
    }
    case 'REPS_ONLY': {
      return sets.map((set: any, index: number) => 
        `Set ${index + 1}: ${set.reps} reps`
      )
    }
    default:
      return []
  }
}

export function formatCurrentProgress(exercise: Exercise, log: LogEntry | undefined, unit: MassUnit): string {
  const details = getCurrentProgressDetails(exercise, log, unit)
  return details.join(' • ')
}

export function formatLast(exercise: Exercise, log: LogEntry | undefined, unit: MassUnit): string {
  if (!log) return '—'
  const p = log.payload || {}
  const sets = p.sets || []
  if (!sets.length) return '—'
  
  switch (exercise.type) {
    case 'WEIGHT_REPS': {
      const counts: Record<string, number> = {}
      sets.forEach((s: any) => {
        const key = String(s.weight)
        counts[key] = (counts[key] || 0) + 1
      })
      const parts = Object.entries(counts).map(([w, c]) => `${c} ${c === 1 ? 'set' : 'sets'} at ${w} ${massLabel(unit)}`)
      return parts.join(', ')
    }
    case 'HOLD_SECONDS': {
      const totalSets = sets.length
      const totalSeconds = sets.reduce((sum: number, s: any) => sum + (s.seconds || 0), 0)
      const avgSeconds = Math.round(totalSeconds / totalSets)
      return `${totalSets} ${totalSets === 1 ? 'set' : 'sets'}, avg ${avgSeconds}s`
    }
    case 'REPS_ONLY': {
      const totalSets = sets.length
      const totalReps = sets.reduce((sum: number, s: any) => sum + (s.reps || 0), 0)
      return `${totalSets} ${totalSets === 1 ? 'set' : 'sets'}, ${totalReps} total reps`
    }
    default:
      return '—'
  }
}

export function computePB(exercise: Exercise, logs: LogEntry[], unit: MassUnit): string {
  const elogs = logs.filter((l) => l.exerciseId === exercise.id)
  if (!elogs.length) return '—'
  switch (exercise.type) {
    case 'WEIGHT_REPS': {
      let max = -Infinity
      elogs.forEach((l) => {
        ;(l.payload?.sets || []).forEach((s: any) => {
          if (typeof s.weight === 'number' && s.weight > max) max = s.weight
        })
      })
      return isFinite(max) ? `${max} ${massLabel(unit)}` : '—'
    }
    case 'HOLD_SECONDS': {
      let max = -Infinity
      elogs.forEach((l) => {
        ;(l.payload?.sets || []).forEach((s: any) => {
          if (typeof s.seconds === 'number' && s.seconds > max) max = s.seconds
        })
      })
      return isFinite(max) ? `${max}s` : '—'
    }
    case 'REPS_ONLY': {
      let max = -Infinity
      elogs.forEach((l) => {
        ;(l.payload?.sets || []).forEach((s: any) => {
          if (typeof s.reps === 'number' && s.reps > max) max = s.reps
        })
      })
      return isFinite(max) ? `${max} reps` : '—'
    }
    default:
      return '—'
  }
}


