import { useCallback } from 'react'
import { toast } from 'sonner'
import { useStore } from '@/store/context'
import { actions } from '@/store/actions'
import { PlanService } from '../services/planService'
import type { Plan, PlanItem } from '../model/plan'
import type { Routine } from '@/features/routines/model/types'

export interface PlanManagerActions {
  addExerciseToPlan: (dateISO: string, exerciseId: string) => void
  addRoutineToPlan: (dateISO: string, routine: Routine) => void
  removeFromPlan: (dateISO: string, itemIndex: number) => void
  reorderPlanItems: (dateISO: string, fromIndex: number, toIndex: number) => void
  updatePlanForDate: (dateISO: string, items: PlanItem[]) => void
  clearPlanForDate: (dateISO: string) => void
  duplicatePlanToDate: (fromDateISO: string, toDateISO: string) => void
  getPlanItemsForDate: (dateISO: string) => PlanItem[]
  isPlanEmpty: () => boolean
}

/**
 * Custom hook for plan management business logic.
 * Provides high-level operations for plan manipulation with undo/redo support.
 */
export function usePlanManager(): PlanManagerActions {
  const { state, dispatch } = useStore()

  const addExerciseToPlan = useCallback((dateISO: string, exerciseId: string) => {
    try {
      const exercise = state.exercises.byId[exerciseId]
      if (!exercise) {
        toast.error('Exercise not found')
        return
      }

      const planItem: PlanItem = {
        type: 'exercise',
        id: exerciseId
      }

      const updatedPlan = PlanService.addItemToPlan(state.planner.plan, dateISO, planItem)
      dispatch(actions.planner.updatePlan(dateISO, updatedPlan[dateISO] || []))
      toast.success(`Added "${exercise.name}" to plan`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add exercise to plan'
      toast.error(message)
    }
  }, [dispatch, state.exercises, state.planner.plan])

  const addRoutineToPlan = useCallback((dateISO: string, routine: Routine) => {
    try {
      // Create a routine snapshot for the plan
      const planItem: PlanItem = {
        type: 'routine',
        name: routine.name,
        color: routine.color || '#6366f1',
        exerciseIds: routine.exerciseIds
      }

      const updatedPlan = PlanService.addItemToPlan(state.planner.plan, dateISO, planItem)
      dispatch(actions.planner.updatePlan(dateISO, updatedPlan[dateISO] || []))
      toast.success(`Added routine "${routine.name}" to plan`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add routine to plan'
      toast.error(message)
    }
  }, [dispatch, state.planner.plan])

  const removeFromPlan = useCallback((dateISO: string, itemIndex: number) => {
    try {
      const currentItems = state.planner.plan[dateISO] || []
      if (itemIndex < 0 || itemIndex >= currentItems.length) {
        toast.error('Invalid item selection')
        return
      }

      const updatedPlan = PlanService.removeItemFromPlan(state.planner.plan, dateISO, itemIndex)
      const newItems = updatedPlan[dateISO] || []
      
      dispatch(actions.planner.updatePlan(dateISO, newItems))
      toast.success('Removed item from plan')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove item from plan'
      toast.error(message)
    }
  }, [dispatch, state.planner.plan])

  const reorderPlanItems = useCallback((dateISO: string, fromIndex: number, toIndex: number) => {
    try {
      const currentItems = state.planner.plan[dateISO] || []
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || 
          fromIndex >= currentItems.length || toIndex >= currentItems.length) {
        return // Invalid reorder operation
      }

      const newItems = [...currentItems]
      const [movedItem] = newItems.splice(fromIndex, 1)
      newItems.splice(toIndex, 0, movedItem)

      const updatedPlan = PlanService.reorderPlanItems(state.planner.plan, dateISO, newItems)
      dispatch(actions.planner.updatePlan(dateISO, updatedPlan[dateISO] || []))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reorder plan items'
      toast.error(message)
    }
  }, [dispatch, state.planner.plan])

  const updatePlanForDate = useCallback((dateISO: string, items: PlanItem[]) => {
    try {
      dispatch(actions.planner.updatePlan(dateISO, items))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update plan'
      toast.error(message)
    }
  }, [dispatch])

  const clearPlanForDate = useCallback((dateISO: string) => {
    try {
      dispatch(actions.planner.updatePlan(dateISO, []))
      toast.success('Cleared plan for date')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear plan'
      toast.error(message)
    }
  }, [dispatch])

  const duplicatePlanToDate = useCallback((fromDateISO: string, toDateISO: string) => {
    try {
      const sourceItems = state.planner.plan[fromDateISO] || []
      if (sourceItems.length === 0) {
        toast.error('No items to copy from source date')
        return
      }

      // Deep copy the items to avoid reference issues
      const copiedItems = sourceItems.map(item => ({ ...item }))
      
      dispatch(actions.planner.updatePlan(toDateISO, copiedItems))
      toast.success(`Copied ${sourceItems.length} items to ${toDateISO}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to duplicate plan'
      toast.error(message)
    }
  }, [dispatch, state.planner.plan])

  const getPlanItemsForDate = useCallback((dateISO: string): PlanItem[] => {
    return PlanService.getPlanItemsForDate(state.planner.plan, dateISO)
  }, [state.planner.plan])

  const isPlanEmpty = useCallback((): boolean => {
    return PlanService.isEmpty(state.planner.plan)
  }, [state.planner.plan])

  return {
    addExerciseToPlan,
    addRoutineToPlan,
    removeFromPlan,
    reorderPlanItems,
    updatePlanForDate,
    clearPlanForDate,
    duplicatePlanToDate,
    getPlanItemsForDate,
    isPlanEmpty
  }
}
