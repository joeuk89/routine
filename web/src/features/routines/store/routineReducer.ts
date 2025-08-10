import type { Routine } from '../model/types'

export interface RoutineState {
  byId: Record<string, Routine>
  allIds: string[]
  loading: boolean
  error: string | null
}

export const initialRoutineState: RoutineState = {
  byId: {},
  allIds: [],
  loading: false,
  error: null
}

export type RoutineAction =
  | { type: 'ROUTINES_ADD'; payload: { routine: Routine } }
  | { type: 'ROUTINES_REMOVE'; payload: { id: string } }
  | { type: 'ROUTINES_UPDATE'; payload: { routine: Routine } }
  | { type: 'ROUTINES_REORDER_EXERCISES'; payload: { routineId: string; exerciseIds: string[] } }
  | { type: 'ROUTINES_SET_LOADING'; payload: { loading: boolean } }
  | { type: 'ROUTINES_SET_ERROR'; payload: { error: string | null } }
  | { type: 'ROUTINES_LOAD_ALL'; payload: { routines: Routine[] } }

export function routineReducer(
  state: RoutineState = initialRoutineState,
  action: RoutineAction
): RoutineState {
  switch (action.type) {
    case 'ROUTINES_ADD': {
      const { routine } = action.payload
      return {
        ...state,
        byId: {
          ...state.byId,
          [routine.id]: routine
        },
        allIds: [...state.allIds, routine.id],
        error: null
      }
    }
    
    case 'ROUTINES_REMOVE': {
      const { id } = action.payload
      const newById = { ...state.byId }
      delete newById[id]
      
      return {
        ...state,
        byId: newById,
        allIds: state.allIds.filter(routineId => routineId !== id),
        error: null
      }
    }
    
    case 'ROUTINES_UPDATE': {
      const { routine } = action.payload
      return {
        ...state,
        byId: {
          ...state.byId,
          [routine.id]: routine
        },
        error: null
      }
    }
    
    case 'ROUTINES_REORDER_EXERCISES': {
      const { routineId, exerciseIds } = action.payload
      const routine = state.byId[routineId]
      
      if (!routine) {
        return {
          ...state,
          error: `Routine with id ${routineId} not found`
        }
      }
      
      return {
        ...state,
        byId: {
          ...state.byId,
          [routineId]: {
            ...routine,
            exerciseIds
          }
        },
        error: null
      }
    }
    
    case 'ROUTINES_LOAD_ALL': {
      const { routines } = action.payload
      const byId: Record<string, Routine> = {}
      const allIds: string[] = []
      
      routines.forEach(routine => {
        byId[routine.id] = routine
        allIds.push(routine.id)
      })
      
      return {
        ...state,
        byId,
        allIds,
        loading: false,
        error: null
      }
    }
    
    case 'ROUTINES_SET_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      }
      
    case 'ROUTINES_SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        loading: false
      }
      
    default:
      return state
  }
}
