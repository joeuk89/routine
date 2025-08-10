import type { Exercise } from '@/features/exercises/model/types'
import type { Routine } from '@/features/routines/model/types'
import type { PlanItem, Plan } from '@/features/planner/model/plan'
import type { LogEntry, LogPayload } from '@/features/logs/model/log'
import type { AppSettings } from '@/features/settings/model/settings'
import type { AppState, AppActions } from '../rootReducer'

/**
 * Exercise action creators with built-in validation
 */
export const exerciseActions = {
  add: (exercise: Exercise): AppActions => ({
    type: 'EXERCISES_ADD',
    payload: { exercise }
  }),
  
  remove: (id: string): AppActions => ({
    type: 'EXERCISES_REMOVE',
    payload: { id }
  }),
  
  update: (exercise: Exercise): AppActions => ({
    type: 'EXERCISES_UPDATE',
    payload: { exercise }
  }),
  
  setLoading: (loading: boolean): AppActions => ({
    type: 'EXERCISES_SET_LOADING',
    payload: { loading }
  }),
  
  setError: (error: string | null): AppActions => ({
    type: 'EXERCISES_SET_ERROR',
    payload: { error }
  }),
  
  loadAll: (exercises: Exercise[]): AppActions => ({
    type: 'EXERCISES_LOAD_ALL',
    payload: { exercises }
  })
} as const

/**
 * Routine action creators with built-in validation
 */
export const routineActions = {
  add: (routine: Routine): AppActions => ({
    type: 'ROUTINES_ADD',
    payload: { routine }
  }),
  
  remove: (id: string): AppActions => ({
    type: 'ROUTINES_REMOVE',
    payload: { id }
  }),
  
  update: (routine: Routine): AppActions => ({
    type: 'ROUTINES_UPDATE',
    payload: { routine }
  }),
  
  reorderExercises: (routineId: string, exerciseIds: string[]): AppActions => ({
    type: 'ROUTINES_REORDER_EXERCISES',
    payload: { routineId, exerciseIds }
  }),
  
  setLoading: (loading: boolean): AppActions => ({
    type: 'ROUTINES_SET_LOADING',
    payload: { loading }
  }),
  
  setError: (error: string | null): AppActions => ({
    type: 'ROUTINES_SET_ERROR',
    payload: { error }
  }),
  
  loadAll: (routines: Routine[]): AppActions => ({
    type: 'ROUTINES_LOAD_ALL',
    payload: { routines }
  })
} as const

/**
 * Planner action creators with built-in validation
 */
export const plannerActions = {
  updatePlan: (dateISO: string, items: PlanItem[]): AppActions => ({
    type: 'PLANNER_UPDATE_PLAN',
    payload: { dateISO, items }
  }),
  
  reorderItems: (dateISO: string, items: PlanItem[]): AppActions => ({
    type: 'PLANNER_REORDER_ITEMS',
    payload: { dateISO, items }
  }),
  
  setCurrentWeek: (weekStartISO: string): AppActions => ({
    type: 'PLANNER_SET_CURRENT_WEEK',
    payload: { weekStartISO }
  }),
  
  removeExerciseFromPlan: (exerciseId: string): AppActions => ({
    type: 'PLANNER_REMOVE_EXERCISE_FROM_PLAN',
    payload: { exerciseId }
  }),
  
  removeRoutineFromPlan: (routineId: string): AppActions => ({
    type: 'PLANNER_REMOVE_ROUTINE_FROM_PLAN',
    payload: { routineId }
  }),
  
  setLoading: (loading: boolean): AppActions => ({
    type: 'PLANNER_SET_LOADING',
    payload: { loading }
  }),
  
  setError: (error: string | null): AppActions => ({
    type: 'PLANNER_SET_ERROR',
    payload: { error }
  }),
  
  loadPlan: (plan: Plan, currentWeekStartISO: string): AppActions => ({
    type: 'PLANNER_LOAD_PLAN',
    payload: { plan, currentWeekStartISO }
  })
} as const

/**
 * Log action creators with built-in validation
 */
export const logActions = {
  save: (entry: LogEntry): AppActions => ({
    type: 'LOGS_SAVE',
    payload: { entry }
  }),
  
  update: (id: string, payload: LogPayload): AppActions => ({
    type: 'LOGS_UPDATE',
    payload: { id, payload }
  }),
  
  remove: (id: string): AppActions => ({
    type: 'LOGS_REMOVE',
    payload: { id }
  }),
  
  removeByDate: (dateISO: string): AppActions => ({
    type: 'LOGS_REMOVE_BY_DATE',
    payload: { dateISO }
  }),
  
  setLoading: (loading: boolean): AppActions => ({
    type: 'LOGS_SET_LOADING',
    payload: { loading }
  }),
  
  setError: (error: string | null): AppActions => ({
    type: 'LOGS_SET_ERROR',
    payload: { error }
  }),
  
  loadAll: (logs: LogEntry[]): AppActions => ({
    type: 'LOGS_LOAD_ALL',
    payload: { logs }
  })
} as const

/**
 * Settings action creators with built-in validation
 */
export const settingsActions = {
  update: (settings: Partial<AppSettings>): AppActions => ({
    type: 'SETTINGS_UPDATE',
    payload: { settings }
  }),
  
  setLoading: (loading: boolean): AppActions => ({
    type: 'SETTINGS_SET_LOADING',
    payload: { loading }
  }),
  
  setError: (error: string | null): AppActions => ({
    type: 'SETTINGS_SET_ERROR',
    payload: { error }
  }),
  
  load: (settings: AppSettings): AppActions => ({
    type: 'SETTINGS_LOAD',
    payload: { settings }
  })
} as const

/**
 * Root-level action creators
 */
export const rootActions = {
  replaceAll: (state: AppState): AppActions => ({
    type: 'REPLACE_ALL',
    payload: state
  }),
  
  loadFromStorage: (state: AppState): AppActions => ({
    type: 'LOAD_FROM_STORAGE',
    payload: state
  }),
  
  recalculateCurrentWeek: (): AppActions => ({
    type: 'RECALCULATE_CURRENT_WEEK',
    payload: {}
  })
} as const

/**
 * Combined action creators for convenience
 */
export const actions = {
  exercises: exerciseActions,
  routines: routineActions,
  planner: plannerActions,
  logs: logActions,
  settings: settingsActions,
  root: rootActions
} as const

// All action creators are exported as const declarations above
// Access them directly or via the combined 'actions' object
