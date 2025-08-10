import type { Exercise } from '@/features/exercises/model/types'
import type { Plan } from '@/features/planner/model/plan'
import type { LogEntry } from '@/features/logs/model/log'
import type { AppState } from '@/store/rootReducer'
import { ExerciseService } from '@/features/exercises/services/ExerciseService'

/**
 * Selector functions for exercise-related data.
 * Provides optimized access patterns and derived data.
 */
export const exerciseSelectors = {
  /**
   * Gets all exercises as an array.
   */
  getAll: (state: AppState): Exercise[] => {
    return state.exercises.allIds.map(id => state.exercises.byId[id])
  },

  /**
   * Gets an exercise by ID.
   */
  getById: (state: AppState, id: string): Exercise | undefined => {
    return state.exercises.byId[id]
  },

  /**
   * Gets exercises sorted alphabetically by name.
   */
  getSortedByName: (state: AppState): Exercise[] => {
    const allExercises = exerciseSelectors.getAll(state)
    return ExerciseService.sortByName(allExercises)
  },

  /**
   * Gets exercises filtered by progression type.
   */
  getByType: (state: AppState, type: Exercise['type']): Exercise[] => {
    const allExercises = exerciseSelectors.getAll(state)
    return ExerciseService.filterByType(allExercises, type)
  },

  /**
   * Searches exercises by name (case-insensitive).
   */
  searchByName: (state: AppState, query: string): Exercise[] => {
    const allExercises = exerciseSelectors.getAll(state)
    return ExerciseService.searchByName(allExercises, query)
  },

  /**
   * Gets the count of how many times an exercise is used in plans.
   */
  getUsageCount: (state: AppState, exerciseId: string): number => {
    const plan = state.planner.plan
    let count = 0

    for (const items of Object.values(plan)) {
      for (const item of items) {
        if (item.type === 'exercise' && item.id === exerciseId) {
          count++
        } else if (item.type === 'routine' && item.exerciseIds.includes(exerciseId)) {
          count++
        }
      }
    }

    return count
  },

  /**
   * Gets exercises that are currently in use (referenced in plans).
   */
  getInUse: (state: AppState): Exercise[] => {
    const usedIds = new Set<string>()
    
    for (const items of Object.values(state.planner.plan)) {
      for (const item of items) {
        if (item.type === 'exercise') {
          usedIds.add(item.id)
        } else if (item.type === 'routine') {
          item.exerciseIds.forEach(id => usedIds.add(id))
        }
      }
    }

    const allExercises = exerciseSelectors.getAll(state)
    return allExercises.filter(ex => usedIds.has(ex.id))
  },

  /**
   * Gets exercises that are not currently used in any plans.
   */
  getUnused: (state: AppState): Exercise[] => {
    const usedIds = new Set<string>()
    
    for (const items of Object.values(state.planner.plan)) {
      for (const item of items) {
        if (item.type === 'exercise') {
          usedIds.add(item.id)
        } else if (item.type === 'routine') {
          item.exerciseIds.forEach(id => usedIds.add(id))
        }
      }
    }

    const allExercises = exerciseSelectors.getAll(state)
    return allExercises.filter(ex => !usedIds.has(ex.id))
  },

  /**
   * Gets exercises grouped by progression type.
   */
  getGroupedByType: (state: AppState): Record<Exercise['type'], Exercise[]> => {
    const groups: Record<Exercise['type'], Exercise[]> = {
      'WEIGHT_REPS': [],
      'HOLD_SECONDS': [],
      'REPS_ONLY': []
    }

    const allExercises = exerciseSelectors.getAll(state)
    for (const exercise of allExercises) {
      groups[exercise.type].push(exercise)
    }

    // Sort each group alphabetically
    for (const type in groups) {
      groups[type as Exercise['type']] = ExerciseService.sortByName(groups[type as Exercise['type']])
    }

    return groups
  },

  /**
   * Gets exercises with their usage statistics.
   */
  getWithUsageStats: (state: AppState): Array<Exercise & { usageCount: number; canDelete: boolean }> => {
    const allExercises = exerciseSelectors.getAll(state)
    return allExercises.map(exercise => ({
      ...exercise,
      usageCount: exerciseSelectors.getUsageCount(state, exercise.id),
      canDelete: ExerciseService.canDelete(exercise, state.planner.plan)
    }))
  },

  /**
   * Gets the total count of exercises.
   */
  getCount: (state: AppState): number => {
    return state.exercises.allIds.length
  },

  /**
   * Gets count by progression type.
   */
  getCountByType: (state: AppState): Record<Exercise['type'], number> => {
    const counts: Record<Exercise['type'], number> = {
      'WEIGHT_REPS': 0,
      'HOLD_SECONDS': 0,
      'REPS_ONLY': 0
    }

    const allExercises = exerciseSelectors.getAll(state)
    for (const exercise of allExercises) {
      counts[exercise.type]++
    }

    return counts
  }
}

/**
 * Plan-related selectors.
 */
export const planSelectors = {
  /**
   * Gets plan items for a specific date.
   */
  getItemsForDate: (state: AppState, dateISO: string) => {
    return state.planner.plan[dateISO] || []
  },

  /**
   * Gets all dates that have plan items.
   */
  getActiveDates: (state: AppState): string[] => {
    return Object.keys(state.planner.plan).sort()
  },

  /**
   * Gets the total number of plan items across all dates.
   */
  getTotalItemCount: (state: AppState): number => {
    return Object.values(state.planner.plan).reduce((total, items) => total + items.length, 0)
  },

  /**
   * Checks if the plan is empty.
   */
  isEmpty: (state: AppState): boolean => {
    return Object.keys(state.planner.plan).length === 0
  },

  /**
   * Gets unique exercise IDs referenced in the plan.
   */
  getReferencedExerciseIds: (state: AppState): string[] => {
    const ids = new Set<string>()
    
    for (const items of Object.values(state.planner.plan)) {
      for (const item of items) {
        if (item.type === 'exercise') {
          ids.add(item.id)
        } else if (item.type === 'routine') {
          item.exerciseIds.forEach(id => ids.add(id))
        }
      }
    }

    return Array.from(ids)
  },

  /**
   * Gets plan items for a date range.
   */
  getItemsForDateRange: (state: AppState, startDate: string, endDate: string) => {
    const result: Record<string, typeof state.planner.plan[string]> = {}
    
    for (const [dateISO, items] of Object.entries(state.planner.plan)) {
      if (dateISO >= startDate && dateISO <= endDate) {
        result[dateISO] = items
      }
    }

    return result
  }
}

/**
 * Log-related selectors.
 */
export const logSelectors = {
  /**
   * Gets logs for a specific exercise.
   */
  getForExercise: (state: AppState, exerciseId: string): LogEntry[] => {
    return state.logs.allIds.map(id => state.logs.byId[id])
      .filter(log => log.exerciseId === exerciseId)
  },

  /**
   * Gets logs for a specific date.
   */
  getForDate: (state: AppState, dateISO: string): LogEntry[] => {
    return state.logs.allIds.map(id => state.logs.byId[id])
      .filter(log => log.dateISO === dateISO)
  },

  /**
   * Gets the latest log entry for an exercise.
   */
  getLatestForExercise: (state: AppState, exerciseId: string): LogEntry | undefined => {
    const exerciseLogs = logSelectors.getForExercise(state, exerciseId)
    if (exerciseLogs.length === 0) return undefined
    
    return exerciseLogs.reduce((latest, current) => 
      current.dateISO > latest.dateISO ? current : latest
    )
  },

  /**
   * Gets logs for a date range.
   */
  getForDateRange: (state: AppState, startDate: string, endDate: string): LogEntry[] => {
    return state.logs.allIds.map(id => state.logs.byId[id])
      .filter(log => log.dateISO >= startDate && log.dateISO <= endDate)
  },

  /**
   * Gets unique dates with log entries.
   */
  getActiveDates: (state: AppState): string[] => {
    const allLogs = state.logs.allIds.map(id => state.logs.byId[id])
    const dates = new Set(allLogs.map(log => log.dateISO))
    return Array.from(dates).sort()
  },

  /**
   * Gets log count by exercise.
   */
  getCountByExercise: (state: AppState): Record<string, number> => {
    const counts: Record<string, number> = {}
    const allLogs = state.logs.allIds.map(id => state.logs.byId[id])
    
    for (const log of allLogs) {
      counts[log.exerciseId] = (counts[log.exerciseId] || 0) + 1
    }

    return counts
  }
}
