import { useCallback } from 'react'
import { toast } from 'sonner'
import { useStore } from '@/store/context'
import { actions } from '@/store/actions'
import { ExerciseService, type ValidationResult } from '../services/ExerciseService'
import type { Exercise } from '../model/types'
import type { ExerciseFormData } from './useExerciseForm'

export interface ExerciseManagerActions {
  addExercise: (data: ExerciseFormData) => Promise<Exercise>
  updateExercise: (id: string, updates: Partial<ExerciseFormData>) => Promise<Exercise>
  deleteExercise: (id: string) => Promise<void>
  canDeleteExercise: (id: string) => boolean
  validateExercise: (data: ExerciseFormData) => ValidationResult<ExerciseFormData>
}

/**
 * Custom hook for exercise management business logic.
 * Provides high-level operations for CRUD operations with validation and error handling.
 */
export function useExerciseManager(): ExerciseManagerActions {
  const { state, dispatch } = useStore()

  const addExercise = useCallback(async (data: ExerciseFormData): Promise<Exercise> => {
    try {
      const exercise = ExerciseService.create(data)
      dispatch(actions.exercises.add(exercise))
      toast.success('Exercise added successfully')
      return exercise
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create exercise'
      toast.error(message)
      throw error
    }
  }, [dispatch])

  const updateExercise = useCallback(async (id: string, updates: Partial<ExerciseFormData>): Promise<Exercise> => {
    try {
      const existing = state.exercises.byId[id]
      if (!existing) {
        throw new Error('Exercise not found')
      }

      const updated = ExerciseService.update(existing, updates)
      dispatch(actions.exercises.update(updated))
      toast.success('Exercise updated successfully')
      return updated
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update exercise'
      toast.error(message)
      throw error
    }
  }, [dispatch, state.exercises])

  const deleteExercise = useCallback(async (id: string): Promise<void> => {
    try {
      const exercise = state.exercises.byId[id]
      if (!exercise) {
        throw new Error('Exercise not found')
      }

      const canDelete = ExerciseService.canDelete(exercise, state.planner.plan)
      if (!canDelete) {
        throw new Error('Cannot delete exercise that is used in plans or routines')
      }

      dispatch(actions.exercises.remove(id))
      toast.success('Exercise deleted successfully')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete exercise'
      toast.error(message)
      throw error
    }
  }, [dispatch, state.exercises, state.planner.plan])

  const canDeleteExercise = useCallback((id: string): boolean => {
    const exercise = state.exercises.byId[id]
    if (!exercise) return false
    
    return ExerciseService.canDelete(exercise, state.planner.plan)
  }, [state.exercises, state.planner.plan])

  const validateExercise = useCallback((data: ExerciseFormData): ValidationResult<ExerciseFormData> => {
    return ExerciseService.validate(data)
  }, [])

  return {
    addExercise,
    updateExercise,
    deleteExercise,
    canDeleteExercise,
    validateExercise
  }
}
