import type { Plan, PlanItem } from '../model/plan'

/**
 * Service class for plan manipulation operations.
 * Extracts complex business logic from reducers and provides reusable utilities.
 */
export class PlanService {
  /**
   * Removes an exercise from all dates in the plan.
   * For routine snapshots, removes the exercise from exerciseIds array.
   * Removes empty routines and empty date entries.
   */
  static removeExerciseFromPlan(plan: Plan, exerciseId: string): Plan {
    const filteredPlan: Plan = {}
    
    Object.entries(plan).forEach(([dateISO, items]) => {
      const filteredItems = items.map((item) => {
        if (item.type === 'exercise') {
          // Remove exercise items with matching ID
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
      
      // Only keep dates that have remaining items
      if (filteredItems.length > 0) {
        filteredPlan[dateISO] = filteredItems
      }
    })
    
    return filteredPlan
  }

  /**
   * Removes a routine from all dates in the plan.
   * Only removes routine snapshots that match both name and color.
   */
  static removeRoutineFromPlan(plan: Plan, routineName: string, routineColor: string): Plan {
    const filteredPlan: Plan = {}
    
    Object.entries(plan).forEach(([dateISO, items]) => {
      const filteredItems = items.filter((item) => {
        if (item.type === 'routine') {
          // Remove routine snapshots with matching name and color
          return !(item.name === routineName && item.color === routineColor)
        }
        // Keep all exercise items
        return true
      })
      
      // Only keep dates that have remaining items
      if (filteredItems.length > 0) {
        filteredPlan[dateISO] = filteredItems
      }
    })
    
    return filteredPlan
  }

  /**
   * Adds a plan item to a specific date.
   */
  static addItemToPlan(plan: Plan, dateISO: string, item: PlanItem): Plan {
    const currentItems = plan[dateISO] || []
    return {
      ...plan,
      [dateISO]: [...currentItems, item]
    }
  }

  /**
   * Sets the plan items for a specific date, replacing any existing items.
   */
  static setPlanItemsForDate(plan: Plan, dateISO: string, items: PlanItem[]): Plan {
    if (items.length === 0) {
      // Remove the date entry if no items
      const { [dateISO]: removed, ...remainingPlan } = plan
      return remainingPlan
    }
    
    return {
      ...plan,
      [dateISO]: items
    }
  }

  /**
   * Reorders plan items within a specific date.
   */
  static reorderPlanItems(plan: Plan, dateISO: string, reorderedItems: PlanItem[]): Plan {
    return this.setPlanItemsForDate(plan, dateISO, reorderedItems)
  }

  /**
   * Gets plan items for a specific date.
   */
  static getPlanItemsForDate(plan: Plan, dateISO: string): PlanItem[] {
    return plan[dateISO] || []
  }

  /**
   * Removes a specific item from a plan date by index.
   */
  static removeItemFromPlan(plan: Plan, dateISO: string, itemIndex: number): Plan {
    const currentItems = plan[dateISO] || []
    if (itemIndex < 0 || itemIndex >= currentItems.length) {
      return plan // Invalid index, return unchanged
    }
    
    const newItems = [...currentItems]
    newItems.splice(itemIndex, 1)
    
    return this.setPlanItemsForDate(plan, dateISO, newItems)
  }

  /**
   * Checks if a plan is empty (no items on any date).
   */
  static isEmpty(plan: Plan): boolean {
    return Object.keys(plan).length === 0
  }

  /**
   * Gets all dates that have plan items.
   */
  static getActiveDates(plan: Plan): string[] {
    return Object.keys(plan).sort()
  }

  /**
   * Gets the total number of plan items across all dates.
   */
  static getTotalItemCount(plan: Plan): number {
    return Object.values(plan).reduce((total, items) => total + items.length, 0)
  }
}
