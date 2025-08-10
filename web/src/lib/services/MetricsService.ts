import type { Exercise } from '@/features/exercises/model/types'
import type { LogEntry, WorkoutSet } from '@/features/logs/model/log'
import type { Plan, PlanItem } from '@/features/planner/model/plan'
import type { MassUnit } from '../units'
import { massLabel } from '../units'

export interface PersonalBest {
  value: number
  unit?: string
  date: string
  type: 'weight' | 'reps' | 'seconds' | 'distance'
}

export interface ProgressTrend {
  direction: 'up' | 'down' | 'stable' | 'insufficient_data'
  changePercent?: number
  dataPoints: number
  periodDays: number
}

export interface WorkoutSummary {
  totalExercises: number
  totalSets: number
  totalVolume?: number
  totalTime?: number
  exercises: Array<{
    exerciseId: string
    sets: number
    bestSet?: WorkoutSet
  }>
}

export interface WeeklyStats {
  weekStartISO: string
  totalWorkouts: number
  totalExercises: number
  totalSets: number
  totalVolume?: number
  completionRate: number // percentage of planned exercises completed
  exerciseFrequency: Record<string, number>
}

export interface CompletionStats {
  totalPlannedItems: number
  completedItems: number
  completionRate: number
  completedByDate: Record<string, number>
  plannedByDate: Record<string, number>
}

/**
 * Service class for metrics calculations and statistics.
 * Extracts complex calculation logic from components.
 */
export class MetricsService {
  /**
   * Calculates the personal best for an exercise based on its type.
   */
  static calculatePersonalBest(exercise: Exercise, logs: LogEntry[]): PersonalBest | null {
    const exerciseLogs = logs.filter(log => log.exerciseId === exercise.id)
    if (exerciseLogs.length === 0) return null

    let best: PersonalBest | null = null

    for (const log of exerciseLogs) {
      const sets = log.payload?.sets || []
      
      for (const set of sets) {
        let currentBest: PersonalBest | null = null

        switch (exercise.type) {
          case 'WEIGHT_REPS':
            if ('weight' in set && 'reps' in set && typeof set.weight === 'number' && typeof set.reps === 'number') {
              // Track the actual best weight achieved (regardless of reps)
              currentBest = {
                value: set.weight,
                unit: 'weight',
                date: log.dateISO,
                type: 'weight'
              }
            }
            break

          case 'REPS_ONLY':
            if ('reps' in set && typeof set.reps === 'number') {
              currentBest = {
                value: set.reps,
                unit: 'reps',
                date: log.dateISO,
                type: 'reps'
              }
            }
            break

          case 'HOLD_SECONDS':
            if ('seconds' in set && typeof set.seconds === 'number') {
              currentBest = {
                value: set.seconds,
                unit: 'seconds',
                date: log.dateISO,
                type: 'seconds'
              }
            }
            break


        }

        if (currentBest && (!best || currentBest.value > best.value)) {
          best = currentBest
        }
      }
    }

    return best
  }

  /**
   * Analyzes progress trend for an exercise over a specified period.
   */
  static getProgressTrend(exercise: Exercise, logs: LogEntry[], days: number): ProgressTrend {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffISO = cutoffDate.toISOString().split('T')[0]

    const recentLogs = logs
      .filter(log => log.exerciseId === exercise.id && log.dateISO >= cutoffISO)
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))

    if (recentLogs.length < 2) {
      return {
        direction: 'insufficient_data',
        dataPoints: recentLogs.length,
        periodDays: days
      }
    }

    // Calculate primary metric for each log entry
    const dataPoints = recentLogs.map(log => {
      const sets = log.payload?.sets || []
      if (sets.length === 0) return 0

      switch (exercise.type) {
        case 'WEIGHT_REPS':
          // Use best set's actual weight
          return Math.max(...sets.map(set => {
            if ('weight' in set && 'reps' in set && typeof set.weight === 'number' && typeof set.reps === 'number') {
              return set.weight
            }
            return 0
          }))

        case 'REPS_ONLY':
          return Math.max(...sets.map(set => 
            'reps' in set && typeof set.reps === 'number' ? set.reps : 0
          ))

        case 'HOLD_SECONDS':
          return Math.max(...sets.map(set => 
            'seconds' in set && typeof set.seconds === 'number' ? set.seconds : 0
          ))



        default:
          return 0
      }
    }).filter(value => value > 0)

    if (dataPoints.length < 2) {
      return {
        direction: 'insufficient_data',
        dataPoints: dataPoints.length,
        periodDays: days
      }
    }

    // Simple linear trend analysis
    const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2))
    const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100

    let direction: ProgressTrend['direction'] = 'stable'
    if (changePercent > 5) direction = 'up'
    else if (changePercent < -5) direction = 'down'

    return {
      direction,
      changePercent: Math.round(changePercent * 10) / 10,
      dataPoints: dataPoints.length,
      periodDays: days
    }
  }

  /**
   * Generates a summary of workout performance for a specific date.
   */
  static getWorkoutSummary(logs: LogEntry[], dateISO: string): WorkoutSummary {
    const dayLogs = logs.filter(log => log.dateISO === dateISO)
    
    const exerciseStats = new Map<string, { sets: number; bestSet?: WorkoutSet }>()
    let totalSets = 0
    let totalVolume = 0

    for (const log of dayLogs) {
      const sets = log.payload?.sets || []
      const exerciseId = log.exerciseId
      
      let bestSet: WorkoutSet | undefined
      let exerciseVolume = 0

      for (const set of sets) {
        totalSets++

        // Calculate volume for weight-based exercises
        if ('weight' in set && 'reps' in set && typeof set.weight === 'number' && typeof set.reps === 'number') {
          const volume = set.weight * set.reps
          exerciseVolume += volume
          
          if (!bestSet || (('weight' in bestSet && 'reps' in bestSet) && 
              (set.weight > bestSet.weight || (set.weight === bestSet.weight && set.reps > bestSet.reps)))) {
            bestSet = set
          }
        } else if (!bestSet) {
          bestSet = set
        }
      }

      totalVolume += exerciseVolume
      
      const existing = exerciseStats.get(exerciseId)
      exerciseStats.set(exerciseId, {
        sets: (existing?.sets || 0) + sets.length,
        bestSet: bestSet || existing?.bestSet
      })
    }

    return {
      totalExercises: exerciseStats.size,
      totalSets,
      totalVolume: totalVolume > 0 ? totalVolume : undefined,
      exercises: Array.from(exerciseStats.entries()).map(([exerciseId, stats]) => ({
        exerciseId,
        sets: stats.sets,
        bestSet: stats.bestSet
      }))
    }
  }

  /**
   * Calculates weekly statistics including completion rates.
   */
  static calculateWeeklyStats(logs: LogEntry[], plan: Plan, weekStartISO: string, weekDates: string[]): WeeklyStats {
    const weekLogs = logs.filter(log => weekDates.includes(log.dateISO))
    
    // Count planned items for the week
    let totalPlannedItems = 0
    const plannedExercises = new Set<string>()
    
    for (const dateISO of weekDates) {
      const dayPlan = plan[dateISO] || []
      for (const item of dayPlan) {
        totalPlannedItems++
        if (item.type === 'exercise') {
          plannedExercises.add(item.exerciseId)
        } else if (item.type === 'routine') {
          item.exercises.forEach(exercise => plannedExercises.add(exercise.exerciseId))
        }
      }
    }

    // Count unique exercises worked out
    const workedOutExercises = new Set(weekLogs.map(log => log.exerciseId))
    
    // Count exercise frequency
    const exerciseFrequency: Record<string, number> = {}
    for (const log of weekLogs) {
      exerciseFrequency[log.exerciseId] = (exerciseFrequency[log.exerciseId] || 0) + 1
    }

    // Calculate completion rate
    const completedExercises = Array.from(plannedExercises).filter(id => workedOutExercises.has(id))
    const completionRate = plannedExercises.size > 0 ? (completedExercises.length / plannedExercises.size) * 100 : 0

    // Calculate total volume and workout count
    const workoutDates = new Set(weekLogs.map(log => log.dateISO))
    let totalVolume = 0
    let totalSets = 0

    for (const log of weekLogs) {
      const sets = log.payload?.sets || []
      totalSets += sets.length
      
      for (const set of sets) {
        if ('weight' in set && 'reps' in set && typeof set.weight === 'number' && typeof set.reps === 'number') {
          totalVolume += set.weight * set.reps
        }
      }
    }

    return {
      weekStartISO,
      totalWorkouts: workoutDates.size,
      totalExercises: workedOutExercises.size,
      totalSets,
      totalVolume: totalVolume > 0 ? totalVolume : undefined,
      completionRate: Math.round(completionRate * 10) / 10,
      exerciseFrequency
    }
  }

  /**
   * Calculates plan completion statistics.
   */
  static getCompletionStats(plan: Plan, logs: LogEntry[]): CompletionStats {
    const completedByDate: Record<string, number> = {}
    const plannedByDate: Record<string, number> = {}
    
    let totalPlannedItems = 0
    let completedItems = 0

    // Create a map of logged exercises by date
    const logsByDate = new Map<string, Set<string>>()
    for (const log of logs) {
      if (!logsByDate.has(log.dateISO)) {
        logsByDate.set(log.dateISO, new Set())
      }
      logsByDate.get(log.dateISO)!.add(log.exerciseId)
    }

    // Analyze each date in the plan
    for (const [dateISO, items] of Object.entries(plan)) {
      const plannedExercises = new Set<string>()
      
      // Collect all planned exercises for this date
      for (const item of items) {
        if (item.type === 'exercise') {
          plannedExercises.add(item.exerciseId)
        } else if (item.type === 'routine') {
          item.exercises.forEach(exercise => plannedExercises.add(exercise.exerciseId))
        }
      }

      const plannedCount = plannedExercises.size
      plannedByDate[dateISO] = plannedCount
      totalPlannedItems += plannedCount

      // Count completed exercises
      const loggedExercises = logsByDate.get(dateISO) || new Set()
      const completed = Array.from(plannedExercises).filter(id => loggedExercises.has(id))
      
      completedByDate[dateISO] = completed.length
      completedItems += completed.length
    }

    const completionRate = totalPlannedItems > 0 ? (completedItems / totalPlannedItems) * 100 : 0

    return {
      totalPlannedItems,
      completedItems,
      completionRate: Math.round(completionRate * 10) / 10,
      completedByDate,
      plannedByDate
    }
  }

  /**
   * Formats progress details for display.
   */
  static getCurrentProgressDetails(exercise: Exercise, log: LogEntry | undefined, unit: MassUnit): string[] {
    if (!log) return []
    const sets = log.payload?.sets || []
    if (!sets.length) return []
    
    switch (exercise.type) {
      case 'WEIGHT_REPS':
        return sets.map((set: WorkoutSet, index: number) => {
          if ('weight' in set && 'reps' in set) {
            return `${set.reps} × ${set.weight}${massLabel(unit)}`
          }
          return `Invalid set type`
        })

      case 'HOLD_SECONDS':
        return sets.map((set: WorkoutSet, index: number) => {
          if ('seconds' in set) {
            return `${set.seconds}s`
          }
          return `Invalid set type`
        })

      case 'REPS_ONLY':
        return sets.map((set: WorkoutSet, index: number) => {
          if ('reps' in set) {
            return `${set.reps} reps`
          }
          return `Invalid set type`
        })

      default:
        return []
    }
  }

  /**
   * Gets the latest log for an exercise before a specific date.
   */
  static getLatestLogBeforeDate(logs: LogEntry[], exerciseId: string, beforeDateISO: string): LogEntry | undefined {
    const exerciseLogs = logs.filter(log => log.exerciseId === exerciseId && log.dateISO < beforeDateISO)
    if (exerciseLogs.length === 0) return undefined
    
    return exerciseLogs.reduce((latest, current) => 
      current.dateISO > latest.dateISO ? current : latest
    )
  }

  /**
   * Gets the log for an exercise instance on a specific date.
   */
  static getLogOnDate(logs: LogEntry[], exerciseId: string, instanceId: string, dateISO: string): LogEntry | undefined {
    return logs.find(log => log.exerciseId === exerciseId && log.instanceId === instanceId && log.dateISO === dateISO)
  }

  /**
   * Formats personal best as a simple string for display.
   */
  static formatPersonalBest(exercise: Exercise, logs: LogEntry[], unit: MassUnit): string {
    const pb = this.calculatePersonalBest(exercise, logs)
    if (!pb) return '—'

    switch (exercise.type) {
      case 'WEIGHT_REPS':
        return `${pb.value}${massLabel(unit)}`
      case 'HOLD_SECONDS':
        return `${pb.value}s`
      case 'REPS_ONLY':
        return `${pb.value} reps`
      default:
        return '—'
    }
  }

  /**
   * Formats the last workout summary for an exercise.
   */
  static formatLastWorkout(exercise: Exercise, log: LogEntry | undefined, unit: MassUnit): string {
    if (!log) return '—'
    const sets = log.payload?.sets || []
    if (!sets.length) return '—'
    
    switch (exercise.type) {
      case 'WEIGHT_REPS': {
        const counts: Record<string, number> = {}
        sets.forEach((s: WorkoutSet) => {
          if ('weight' in s && 'reps' in s) {
            const key = String(s.weight)
            counts[key] = (counts[key] || 0) + 1
          }
        })
        const parts = Object.entries(counts).map(([w, c]) => 
          `${c} ${c === 1 ? 'set' : 'sets'} at ${w} ${massLabel(unit)}`
        )
        return parts.join(', ')
      }

      case 'HOLD_SECONDS': {
        const totalSeconds = sets.reduce((sum, s: WorkoutSet) => 
          'seconds' in s ? sum + (s.seconds as number) : sum, 0
        )
        return `${sets.length} ${sets.length === 1 ? 'set' : 'sets'}, ${totalSeconds}s total`
      }

      case 'REPS_ONLY': {
        const totalReps = sets.reduce((sum, s: WorkoutSet) => 
          'reps' in s ? sum + (s.reps as number) : sum, 0
        )
        return `${sets.length} ${sets.length === 1 ? 'set' : 'sets'}, ${totalReps} reps total`
      }

      default:
        return '—'
    }
  }
}
