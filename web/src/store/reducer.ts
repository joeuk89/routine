import type { AppState } from './state'
import { defaultState } from './state'
import type { Actions } from './actions'
import { startOfWeek, iso } from '@/lib/date'
import { setPlanItemsForDate, getPlanItemsForDate } from '@/features/planner/model/plan'
import type { Plan, PlanItem } from '@/features/planner/model/plan'

export function reducer(state: AppState = defaultState, action: Actions): AppState {
  switch (action.type) {
    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.payload] }
    case 'REMOVE_EXERCISE': {
      // Remove exercise from all dates in the plan
      const filteredPlan: Plan = {}
      Object.entries(state.plan).forEach(([dateISO, items]) => {
        const filteredItems = items.map((item) => {
          if (item.type === 'exercise') {
            return item.id !== action.payload.id ? item : null
          } else {
            // For routine snapshots, remove the exercise from the exerciseIds
            const filteredExerciseIds = item.exerciseIds.filter(id => id !== action.payload.id)
            return filteredExerciseIds.length > 0 ? {
              ...item,
              exerciseIds: filteredExerciseIds
            } : null
          }
        }).filter((item): item is NonNullable<typeof item> => item !== null)
        
        if (filteredItems.length > 0) {
          filteredPlan[dateISO] = filteredItems
        }
      })
      
      return { 
        ...state, 
        exercises: state.exercises.filter((e) => e.id !== action.payload.id), 
        plan: filteredPlan 
      }
    }
    case 'EDIT_EXERCISE':
      return { ...state, exercises: state.exercises.map((e) => (e.id === action.payload.id ? action.payload : e)) }
    case 'ADD_ROUTINE':
      return { ...state, routines: [...state.routines, action.payload] }
    case 'REMOVE_ROUTINE':
      return { ...state, routines: state.routines.filter((r) => r.id !== action.payload.id) }
    case 'EDIT_ROUTINE':
      return { ...state, routines: state.routines.map((r) => (r.id === action.payload.id ? action.payload : r)) }
    case 'REORDER_ROUTINE_EXERCISES':
      return { ...state, routines: state.routines.map((r) => 
        r.id === action.payload.routineId 
          ? { ...r, exerciseIds: action.payload.exerciseIds }
          : r
      )}
    case 'UPDATE_PLAN': {
      const newPlan = setPlanItemsForDate(state.plan, action.payload.dateISO, action.payload.items)
      return { ...state, plan: newPlan }
    }
    case 'REORDER_PLAN_ITEMS': {
      const newPlan = setPlanItemsForDate(state.plan, action.payload.dateISO, action.payload.items)
      return { ...state, plan: newPlan }
    }
    case 'SET_SETTINGS': {
      const newSettings = { ...state.settings, ...action.payload }
      let newState = { ...state, settings: newSettings }
      
      // If weekStartDay changed, recalculate the current week
      if (action.payload.weekStartDay && action.payload.weekStartDay !== state.settings.weekStartDay) {
        const today = new Date()
        const newWeekStart = startOfWeek(today, action.payload.weekStartDay)
        const newWeekStartISO = iso(newWeekStart)
        newState.currentWeekStartISO = newWeekStartISO
      }
      
      return newState
    }
    case 'RECALCULATE_CURRENT_WEEK': {
      const today = new Date()
      const weekStartDay = state.settings.weekStartDay || 'Monday'
      const newWeekStart = startOfWeek(today, weekStartDay)
      const newWeekStartISO = iso(newWeekStart)
      return { ...state, currentWeekStartISO: newWeekStartISO }
    }
    case 'SET_CURRENT_WEEK':
      return { ...state, currentWeekStartISO: action.payload.weekStartISO }
    case 'SAVE_LOG':
      return { ...state, logs: [...state.logs, action.payload.entry] }
    case 'UPDATE_LOG':
      return { ...state, logs: state.logs.map((log) => (log.id === action.payload.id ? { ...log, payload: action.payload.payload } : log)) }
    case 'REPLACE_ALL':
      return action.payload
    case 'LOAD_FROM_STORAGE':
      // Merge with default state to ensure all properties are defined
      return { ...defaultState, ...action.payload, plan: action.payload.plan || {} }
    default:
      return state
  }
}


