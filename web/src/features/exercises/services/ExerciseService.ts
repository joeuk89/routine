import type { Exercise } from '../model/types'
import type { ExerciseFormData } from '../hooks/useExerciseForm'
import type { Plan, PlanItem } from '@/features/planner/model/plan'
import type { LogEntry } from '@/features/logs/model/log'
import { uid } from '@/lib/id'

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: Partial<Record<keyof T, string>>
}

export interface ExerciseUsageStats {
  totalPlanUsage: number
  uniqueDatesUsed: number
  inRoutinesCount: number
  totalLogEntries: number
  lastUsedDate?: string
}

/**
 * Service class for exercise domain operations.
 * Handles validation, creation, updates, and usage analysis.
 */
export class ExerciseService {
  /**
   * Validates exercise form data and returns validation result.
   */
  static validate(data: ExerciseFormData): ValidationResult<ExerciseFormData> {
    const errors: Partial<Record<keyof ExerciseFormData, string>> = {}
    
    if (!data.name.trim()) {
      errors.name = 'Exercise name is required'
    } else if (data.name.trim().length > 100) {
      errors.name = 'Exercise name must be less than 100 characters'
    }
    
    if (!data.color) {
      errors.color = 'Color is required'
    } else if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
      errors.color = 'Color must be a valid hex color'
    }
    
    if (data.refUrl && data.refUrl.trim()) {
      try {
        new URL(data.refUrl.trim())
      } catch {
        errors.refUrl = 'Reference URL must be a valid URL'
      }
    }
    
    const success = Object.keys(errors).length === 0
    
    return {
      success,
      data: success ? data : undefined,
      errors: success ? undefined : errors
    }
  }

  /**
   * Creates a new exercise from validated form data.
   */
  static create(data: ExerciseFormData): Exercise {
    const validation = this.validate(data)
    if (!validation.success) {
      throw new Error('Form validation failed')
    }

    return {
      id: uid(),
      name: data.name.trim(),
      color: data.color,
      type: data.type,
      weightUnit: data.type === 'WEIGHT_REPS' ? data.weightUnit : undefined,
      refUrl: data.refUrl?.trim() || undefined
    }
  }

  /**
   * Updates an existing exercise with new data.
   */
  static update(existing: Exercise, updates: Partial<ExerciseFormData>): Exercise {
    // Create merged form data for validation
    const formData: ExerciseFormData = {
      name: updates.name ?? existing.name,
      color: updates.color ?? existing.color,
      type: updates.type ?? existing.type,
      weightUnit: updates.weightUnit ?? existing.weightUnit ?? 'DEFAULT',
      refUrl: updates.refUrl ?? existing.refUrl ?? ''
    }

    const validation = this.validate(formData)
    if (!validation.success) {
      throw new Error('Update validation failed')
    }

    return {
      ...existing,
      name: formData.name.trim(),
      color: formData.color,
      type: formData.type,
      weightUnit: formData.type === 'WEIGHT_REPS' ? formData.weightUnit : undefined,
      refUrl: formData.refUrl?.trim() || undefined
    }
  }

  /**
   * Checks if an exercise can be safely deleted.
   * Returns false if exercise is used in plans or routines.
   */
  static canDelete(exercise: Exercise, plan: Plan): boolean {
    // Check if exercise is directly used in any plan
    for (const items of Object.values(plan)) {
      for (const item of items) {
        if (item.type === 'exercise' && item.id === exercise.id) {
          return false
        }
        // Check if exercise is part of any routine snapshots
        if (item.type === 'routine' && item.exerciseIds.includes(exercise.id)) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Gets detailed usage statistics for an exercise.
   */
  static getUsageStats(exercise: Exercise, plan: Plan, logs: LogEntry[]): ExerciseUsageStats {
    let totalPlanUsage = 0
    const uniqueDates = new Set<string>()
    let inRoutinesCount = 0

    // Analyze plan usage
    for (const [dateISO, items] of Object.entries(plan)) {
      for (const item of items) {
        if (item.type === 'exercise' && item.id === exercise.id) {
          totalPlanUsage++
          uniqueDates.add(dateISO)
        } else if (item.type === 'routine' && item.exerciseIds.includes(exercise.id)) {
          inRoutinesCount++
          uniqueDates.add(dateISO)
        }
      }
    }

    // Analyze log entries
    const exerciseLogs = logs.filter(log => log.exerciseId === exercise.id)
    const lastLog = exerciseLogs.length > 0 
      ? exerciseLogs.reduce((latest, current) => 
          current.dateISO > latest.dateISO ? current : latest
        )
      : undefined

    return {
      totalPlanUsage,
      uniqueDatesUsed: uniqueDates.size,
      inRoutinesCount,
      totalLogEntries: exerciseLogs.length,
      lastUsedDate: lastLog?.dateISO
    }
  }

  /**
   * Sorts exercises alphabetically by name.
   */
  static sortByName(exercises: Exercise[]): Exercise[] {
    return [...exercises].sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Filters exercises by progression type.
   */
  static filterByType(exercises: Exercise[], type: Exercise['type']): Exercise[] {
    return exercises.filter(exercise => exercise.type === type)
  }

  /**
   * Searches exercises by name (case-insensitive).
   */
  static searchByName(exercises: Exercise[], query: string): Exercise[] {
    if (!query.trim()) return exercises
    
    const normalizedQuery = query.trim().toLowerCase()
    return exercises.filter(exercise => 
      exercise.name.toLowerCase().includes(normalizedQuery)
    )
  }

  /**
   * Converts exercise to form data for editing.
   */
  static toFormData(exercise: Exercise): ExerciseFormData {
    return {
      name: exercise.name,
      color: exercise.color,
      type: exercise.type,
      weightUnit: exercise.weightUnit ?? 'DEFAULT',
      refUrl: exercise.refUrl ?? ''
    }
  }
}
