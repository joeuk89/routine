import type { Plan, PlanItem } from '../model/plan'

export interface PlannerState {
  plan: Plan
  currentWeekStartISO: string
  loading: boolean
  error: string | null
}

export const initialPlannerState: PlannerState = {
  plan: {},
  currentWeekStartISO: '',
  loading: false,
  error: null
}

export type PlannerAction =
  | { type: 'PLANNER_UPDATE_PLAN'; payload: { dateISO: string; items: PlanItem[] } }
  | { type: 'PLANNER_REORDER_ITEMS'; payload: { dateISO: string; items: PlanItem[] } }
  | { type: 'PLANNER_SET_CURRENT_WEEK'; payload: { weekStartISO: string } }
  | { type: 'PLANNER_REMOVE_EXERCISE_FROM_PLAN'; payload: { exerciseId: string } }
  | { type: 'PLANNER_REMOVE_ROUTINE_FROM_PLAN'; payload: { routineId: string } }
  | { type: 'PLANNER_SET_LOADING'; payload: { loading: boolean } }
  | { type: 'PLANNER_SET_ERROR'; payload: { error: string | null } }
  | { type: 'PLANNER_LOAD_PLAN'; payload: { plan: Plan; currentWeekStartISO: string } }

export function plannerReducer(
  state: PlannerState = initialPlannerState,
  action: PlannerAction
): PlannerState {
  switch (action.type) {
    case 'PLANNER_UPDATE_PLAN': {
      const { dateISO, items } = action.payload
      const newPlan = { ...state.plan }
      
      if (items.length === 0) {
        delete newPlan[dateISO]
      } else {
        newPlan[dateISO] = items
      }
      
      return {
        ...state,
        plan: newPlan,
        error: null
      }
    }
    
    case 'PLANNER_REORDER_ITEMS': {
      const { dateISO, items } = action.payload
      return {
        ...state,
        plan: {
          ...state.plan,
          [dateISO]: items
        },
        error: null
      }
    }
    
    case 'PLANNER_SET_CURRENT_WEEK':
      return {
        ...state,
        currentWeekStartISO: action.payload.weekStartISO
      }
    
    case 'PLANNER_REMOVE_EXERCISE_FROM_PLAN': {
      const { exerciseId } = action.payload
      const filteredPlan: Plan = {}
      
      Object.entries(state.plan).forEach(([dateISO, items]) => {
        const filteredItems = items.map((item) => {
          if (item.type === 'exercise') {
            return item.id !== exerciseId ? item : null
          } else {
            // For routine snapshots, remove the exercise from the exerciseIds
            const filteredExerciseIds = item.exerciseIds.filter(id => id !== exerciseId)
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
        plan: filteredPlan,
        error: null
      }
    }
    
    case 'PLANNER_REMOVE_ROUTINE_FROM_PLAN': {
      const { routineId } = action.payload
      const filteredPlan: Plan = {}
      
      Object.entries(state.plan).forEach(([dateISO, items]) => {
        const filteredItems = items.filter(item => 
          !(item.type === 'routine' && item.name === routineId)
        )
        
        if (filteredItems.length > 0) {
          filteredPlan[dateISO] = filteredItems
        }
      })
      
      return {
        ...state,
        plan: filteredPlan,
        error: null
      }
    }
    
    case 'PLANNER_LOAD_PLAN':
      return {
        ...state,
        plan: action.payload.plan,
        currentWeekStartISO: action.payload.currentWeekStartISO,
        loading: false,
        error: null
      }
      
    case 'PLANNER_SET_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      }
      
    case 'PLANNER_SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        loading: false
      }
      
    default:
      return state
  }
}
