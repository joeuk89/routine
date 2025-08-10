import type { LogEntry } from '@/features/logs/model/log'
import type { PlanItem } from '@/features/planner/model/plan'

/**
 * Check if an exercise has logged data for a specific date
 */
export function hasLoggedData(exerciseId: string, dateISO: string, logs: LogEntry[]): boolean {
  return logs.some(log => log.exerciseId === exerciseId && log.dateISO === dateISO)
}

/**
 * Check if a plan item (exercise or routine) can be dragged based on logged data
 */
export function canDragPlanItem(item: PlanItem, dateISO: string, logs: LogEntry[]): boolean {
  if (item.type === 'exercise') {
    return !hasLoggedData(item.id, dateISO, logs)
  } else {
    // For routines, check if ANY exercise in the routine has logged data
    return !item.exerciseIds.some(exerciseId => hasLoggedData(exerciseId, dateISO, logs))
  }
}

/**
 * Get exercises that cannot be dragged due to logged data
 */
export function getNonDraggableExercises(exerciseIds: string[], dateISO: string, logs: LogEntry[]): string[] {
  return exerciseIds.filter(exerciseId => hasLoggedData(exerciseId, dateISO, logs))
}
