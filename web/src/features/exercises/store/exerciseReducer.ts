import type { Exercise } from '../model/types'

export interface ExerciseState {
  byId: Record<string, Exercise>
  allIds: string[]
  loading: boolean
  error: string | null
}

export const initialExerciseState: ExerciseState = {
  byId: {},
  allIds: [],
  loading: false,
  error: null
}

export type ExerciseAction =
  | { type: 'EXERCISES_ADD'; payload: { exercise: Exercise } }
  | { type: 'EXERCISES_REMOVE'; payload: { id: string } }
  | { type: 'EXERCISES_UPDATE'; payload: { exercise: Exercise } }
  | { type: 'EXERCISES_SET_LOADING'; payload: { loading: boolean } }
  | { type: 'EXERCISES_SET_ERROR'; payload: { error: string | null } }
  | { type: 'EXERCISES_LOAD_ALL'; payload: { exercises: Exercise[] } }

export function exerciseReducer(
  state: ExerciseState = initialExerciseState,
  action: ExerciseAction
): ExerciseState {
  switch (action.type) {
    case 'EXERCISES_ADD': {
      const { exercise } = action.payload
      return {
        ...state,
        byId: {
          ...state.byId,
          [exercise.id]: exercise
        },
        allIds: [...state.allIds, exercise.id],
        error: null
      }
    }
    
    case 'EXERCISES_REMOVE': {
      const { id } = action.payload
      const newById = { ...state.byId }
      delete newById[id]
      
      return {
        ...state,
        byId: newById,
        allIds: state.allIds.filter(exerciseId => exerciseId !== id),
        error: null
      }
    }
    
    case 'EXERCISES_UPDATE': {
      const { exercise } = action.payload
      return {
        ...state,
        byId: {
          ...state.byId,
          [exercise.id]: exercise
        },
        error: null
      }
    }
    
    case 'EXERCISES_LOAD_ALL': {
      const { exercises } = action.payload
      const byId: Record<string, Exercise> = {}
      const allIds: string[] = []
      
      exercises.forEach(exercise => {
        byId[exercise.id] = exercise
        allIds.push(exercise.id)
      })
      
      return {
        ...state,
        byId,
        allIds,
        loading: false,
        error: null
      }
    }
    
    case 'EXERCISES_SET_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      }
      
    case 'EXERCISES_SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        loading: false
      }
      
    default:
      return state
  }
}
