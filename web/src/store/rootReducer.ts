import { exerciseReducer, type ExerciseState, type ExerciseAction } from '@/features/exercises/store/exerciseReducer'
import { routineReducer, type RoutineState, type RoutineAction } from '@/features/routines/store/routineReducer'
import { plannerReducer, type PlannerState, type PlannerAction } from '@/features/planner/store/plannerReducer'
import { logReducer, type LogState, type LogAction } from '@/features/logs/store/logReducer'
import { settingsReducer, type SettingsState, type SettingsAction } from '@/features/settings/store/settingsReducer'
import { iso, startOfWeek } from '@/lib/date'

// New normalized app state structure
export interface AppState {
  exercises: ExerciseState
  routines: RoutineState
  planner: PlannerState
  logs: LogState
  settings: SettingsState
}

// Combined action types
export type AppActions = 
  | ExerciseAction
  | RoutineAction
  | PlannerAction
  | LogAction
  | SettingsAction
  | { type: 'REPLACE_ALL'; payload: AppState }
  | { type: 'LOAD_FROM_STORAGE'; payload: AppState }
  | { type: 'RECALCULATE_CURRENT_WEEK'; payload: {} }

export const defaultAppState: AppState = (() => {
  const today = new Date()
  const currentWeekStart = startOfWeek(today, 'Monday')
  const currentWeekStartISO = iso(currentWeekStart)
  
  return {
    exercises: {
      byId: {},
      allIds: [],
      loading: false,
      error: null
    },
    routines: {
      byId: {},
      allIds: [],
      loading: false,
      error: null
    },
    planner: {
      plan: {},
      currentWeekStartISO,
      loading: false,
      error: null
    },
    logs: {
      byId: {},
      allIds: [],
      loading: false,
      error: null
    },
    settings: {
      preferences: {
        defaultUnit: 'KG',
        weekStartDay: 'Monday'
      },
      loading: false,
      error: null
    }
  }
})()



export function rootReducer(state: AppState = defaultAppState, action: AppActions): AppState {
  switch (action.type) {
    case 'REPLACE_ALL':
      return action.payload
      
    case 'LOAD_FROM_STORAGE':
      // Merge loaded state with defaults to ensure all required properties exist
      return { ...defaultAppState, ...action.payload }
      
    case 'RECALCULATE_CURRENT_WEEK': {
      const today = new Date()
      const weekStartDay = state.settings.preferences.weekStartDay
      const newWeekStart = startOfWeek(today, weekStartDay)
      const newWeekStartISO = iso(newWeekStart)
      
      return {
        ...state,
        planner: plannerReducer(state.planner, {
          type: 'PLANNER_SET_CURRENT_WEEK',
          payload: { weekStartISO: newWeekStartISO }
        })
      }
    }
    
    // Handle settings actions with side effects
    case 'SETTINGS_UPDATE': {
      const newState = {
        ...state,
        settings: settingsReducer(state.settings, action)
      }
      
      // If weekStartDay changed, recalculate the current week
      if (action.payload.settings.weekStartDay && 
          action.payload.settings.weekStartDay !== state.settings.preferences.weekStartDay) {
        const today = new Date()
        const newWeekStart = startOfWeek(today, action.payload.settings.weekStartDay)
        const newWeekStartISO = iso(newWeekStart)
        
        newState.planner = plannerReducer(newState.planner, {
          type: 'PLANNER_SET_CURRENT_WEEK',
          payload: { weekStartISO: newWeekStartISO }
        })
      }
      
      return newState
    }
    
    // Handle exercise removal with plan cleanup
    case 'EXERCISES_REMOVE': {
      const newState = {
        ...state,
        exercises: exerciseReducer(state.exercises, action)
      }
      
      // Also remove the exercise from all plans
      newState.planner = plannerReducer(newState.planner, {
        type: 'PLANNER_REMOVE_EXERCISE_FROM_PLAN',
        payload: { exerciseId: action.payload.id }
      })
      
      return newState
    }
    
    // Handle routine removal with plan cleanup  
    case 'ROUTINES_REMOVE': {
      const newState = {
        ...state,
        routines: routineReducer(state.routines, action)
      }
      
      // Also remove the routine from all plans
      newState.planner = plannerReducer(newState.planner, {
        type: 'PLANNER_REMOVE_ROUTINE_FROM_PLAN', 
        payload: { routineId: action.payload.id }
      })
      
      return newState
    }
    
    default:
      // Route actions to their respective feature reducers
      return {
        exercises: exerciseReducer(state.exercises, action as ExerciseAction),
        routines: routineReducer(state.routines, action as RoutineAction),
        planner: plannerReducer(state.planner, action as PlannerAction),
        logs: logReducer(state.logs, action as LogAction),
        settings: settingsReducer(state.settings, action as SettingsAction)
      }
  }
}


