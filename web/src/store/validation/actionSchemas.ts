import { z } from 'zod'
import type { ProgressionType, WeightUnit } from '@/lib/units'
import type { DayKey } from '@/lib/date'

// Base schemas for common types
const ProgressionTypeSchema = z.enum(['WEIGHT_REPS', 'HOLD_SECONDS', 'REPS_ONLY'] as const) satisfies z.ZodType<ProgressionType>

const WeightUnitSchema = z.enum(['DEFAULT', 'KG', 'LBS'] as const) satisfies z.ZodType<WeightUnit>

const DayKeySchema = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const) satisfies z.ZodType<DayKey>

// Exercise schemas
const ExerciseSchema = z.object({
  id: z.string().min(1, 'Exercise ID is required'),
  name: z.string().min(1, 'Exercise name is required'),
  color: z.string().min(1, 'Exercise color is required'),
  type: ProgressionTypeSchema,
  refUrl: z.string().optional(),
  weightUnit: WeightUnitSchema.optional()
})

const ExerciseActionSchemas = {
  EXERCISES_ADD: z.object({
    type: z.literal('EXERCISES_ADD'),
    payload: z.object({
      exercise: ExerciseSchema
    })
  }),
  EXERCISES_REMOVE: z.object({
    type: z.literal('EXERCISES_REMOVE'),
    payload: z.object({
      id: z.string().min(1, 'Exercise ID is required')
    })
  }),
  EXERCISES_UPDATE: z.object({
    type: z.literal('EXERCISES_UPDATE'),
    payload: z.object({
      exercise: ExerciseSchema
    })
  }),
  EXERCISES_SET_LOADING: z.object({
    type: z.literal('EXERCISES_SET_LOADING'),
    payload: z.object({
      loading: z.boolean()
    })
  }),
  EXERCISES_SET_ERROR: z.object({
    type: z.literal('EXERCISES_SET_ERROR'),
    payload: z.object({
      error: z.string().nullable()
    })
  }),
  EXERCISES_LOAD_ALL: z.object({
    type: z.literal('EXERCISES_LOAD_ALL'),
    payload: z.object({
      exercises: z.array(ExerciseSchema)
    })
  })
}

// Routine schemas
const RoutineSchema = z.object({
  id: z.string().min(1, 'Routine ID is required'),
  name: z.string().min(1, 'Routine name is required'),
  description: z.string().optional(),
  exerciseIds: z.array(z.string()).min(1, 'Routine must contain at least one exercise'),
  color: z.string().optional()
})

const RoutineActionSchemas = {
  ROUTINES_ADD: z.object({
    type: z.literal('ROUTINES_ADD'),
    payload: z.object({
      routine: RoutineSchema
    })
  }),
  ROUTINES_REMOVE: z.object({
    type: z.literal('ROUTINES_REMOVE'),
    payload: z.object({
      id: z.string().min(1, 'Routine ID is required')
    })
  }),
  ROUTINES_UPDATE: z.object({
    type: z.literal('ROUTINES_UPDATE'),
    payload: z.object({
      routine: RoutineSchema
    })
  }),
  ROUTINES_REORDER_EXERCISES: z.object({
    type: z.literal('ROUTINES_REORDER_EXERCISES'),
    payload: z.object({
      routineId: z.string().min(1, 'Routine ID is required'),
      exerciseIds: z.array(z.string()).min(1, 'Exercise IDs are required')
    })
  }),
  ROUTINES_SET_LOADING: z.object({
    type: z.literal('ROUTINES_SET_LOADING'),
    payload: z.object({
      loading: z.boolean()
    })
  }),
  ROUTINES_SET_ERROR: z.object({
    type: z.literal('ROUTINES_SET_ERROR'),
    payload: z.object({
      error: z.string().nullable()
    })
  }),
  ROUTINES_LOAD_ALL: z.object({
    type: z.literal('ROUTINES_LOAD_ALL'),
    payload: z.object({
      routines: z.array(RoutineSchema)
    })
  })
}

// Plan item schemas
const PlanItemSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('exercise'),
    exerciseId: z.string().min(1, 'Exercise ID is required'),
    instanceId: z.string().min(1, 'Instance ID is required')
  }),
  z.object({
    type: z.literal('routine'),
    name: z.string().min(1, 'Routine name is required'),
    color: z.string().min(1, 'Routine color is required'),
    exercises: z.array(z.object({
      exerciseId: z.string().min(1, 'Exercise ID is required'),
      instanceId: z.string().min(1, 'Instance ID is required')
    })).min(1, 'Routine must contain at least one exercise')
  })
])

const PlanSchema = z.record(z.string(), z.array(PlanItemSchema))

const PlannerActionSchemas = {
  PLANNER_UPDATE_PLAN: z.object({
    type: z.literal('PLANNER_UPDATE_PLAN'),
    payload: z.object({
      dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
      items: z.array(PlanItemSchema)
    })
  }),
  PLANNER_REORDER_ITEMS: z.object({
    type: z.literal('PLANNER_REORDER_ITEMS'),
    payload: z.object({
      dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
      items: z.array(PlanItemSchema)
    })
  }),
  PLANNER_SET_CURRENT_WEEK: z.object({
    type: z.literal('PLANNER_SET_CURRENT_WEEK'),
    payload: z.object({
      weekStartISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    })
  }),
  PLANNER_REMOVE_EXERCISE_FROM_PLAN: z.object({
    type: z.literal('PLANNER_REMOVE_EXERCISE_FROM_PLAN'),
    payload: z.object({
      exerciseId: z.string().min(1, 'Exercise ID is required')
    })
  }),
  PLANNER_REMOVE_ROUTINE_FROM_PLAN: z.object({
    type: z.literal('PLANNER_REMOVE_ROUTINE_FROM_PLAN'),
    payload: z.object({
      routineId: z.string().min(1, 'Routine ID is required')
    })
  }),
  PLANNER_SET_LOADING: z.object({
    type: z.literal('PLANNER_SET_LOADING'),
    payload: z.object({
      loading: z.boolean()
    })
  }),
  PLANNER_SET_ERROR: z.object({
    type: z.literal('PLANNER_SET_ERROR'),
    payload: z.object({
      error: z.string().nullable()
    })
  }),
  PLANNER_LOAD_PLAN: z.object({
    type: z.literal('PLANNER_LOAD_PLAN'),
    payload: z.object({
      plan: PlanSchema,
      currentWeekStartISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    })
  })
}

// Log schemas - using custom validation to handle the union types properly
const WorkoutSetSchema = z.custom<any>((val) => {
  if (typeof val !== 'object' || val === null) {
    return false
  }
  
  // WeightRepsSet - has both weight and reps
  if ('weight' in val && 'reps' in val) {
    return typeof val.weight === 'number' && val.weight >= 0 &&
           typeof val.reps === 'number' && Number.isInteger(val.reps) && val.reps >= 1 &&
           Object.keys(val).length === 2
  }
  
  // HoldSecondsSet - has only seconds
  if ('seconds' in val && !('weight' in val) && !('reps' in val)) {
    return typeof val.seconds === 'number' && val.seconds >= 0 &&
           Object.keys(val).length === 1
  }
  
  // RepsOnlySet - has only reps (no weight)
  if ('reps' in val && !('weight' in val) && !('seconds' in val)) {
    return typeof val.reps === 'number' && Number.isInteger(val.reps) && val.reps >= 1 &&
           Object.keys(val).length === 1
  }
  
  return false
}, 'Invalid workout set: must be WeightRepsSet {weight, reps}, HoldSecondsSet {seconds}, or RepsOnlySet {reps}')

const LogPayloadSchema = z.object({
  sets: z.array(WorkoutSetSchema).min(1, 'At least one set is required')
})

const LogEntrySchema = z.object({
  id: z.string().min(1, 'Log ID is required'),
  dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  day: DayKeySchema,
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  instanceId: z.string().min(1, 'Instance ID is required'),
  payload: LogPayloadSchema
})

const LogActionSchemas = {
  LOGS_SAVE: z.object({
    type: z.literal('LOGS_SAVE'),
    payload: z.object({
      entry: LogEntrySchema
    })
  }),
  LOGS_UPDATE: z.object({
    type: z.literal('LOGS_UPDATE'),
    payload: z.object({
      id: z.string().min(1, 'Log ID is required'),
      payload: LogPayloadSchema
    })
  }),
  LOGS_REMOVE: z.object({
    type: z.literal('LOGS_REMOVE'),
    payload: z.object({
      id: z.string().min(1, 'Log ID is required')
    })
  }),
  LOGS_REMOVE_BY_DATE: z.object({
    type: z.literal('LOGS_REMOVE_BY_DATE'),
    payload: z.object({
      dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    })
  }),
  LOGS_SET_LOADING: z.object({
    type: z.literal('LOGS_SET_LOADING'),
    payload: z.object({
      loading: z.boolean()
    })
  }),
  LOGS_SET_ERROR: z.object({
    type: z.literal('LOGS_SET_ERROR'),
    payload: z.object({
      error: z.string().nullable()
    })
  }),
  LOGS_LOAD_ALL: z.object({
    type: z.literal('LOGS_LOAD_ALL'),
    payload: z.object({
      logs: z.array(LogEntrySchema)
    })
  })
}

// Settings schemas
const AppSettingsSchema = z.object({
  defaultUnit: z.enum(['KG', 'LBS'] as const),
  weekStartDay: DayKeySchema
})

const SettingsActionSchemas = {
  SETTINGS_UPDATE: z.object({
    type: z.literal('SETTINGS_UPDATE'),
    payload: z.object({
      settings: AppSettingsSchema.partial()
    })
  }),
  SETTINGS_SET_LOADING: z.object({
    type: z.literal('SETTINGS_SET_LOADING'),
    payload: z.object({
      loading: z.boolean()
    })
  }),
  SETTINGS_SET_ERROR: z.object({
    type: z.literal('SETTINGS_SET_ERROR'),
    payload: z.object({
      error: z.string().nullable()
    })
  }),
  SETTINGS_LOAD: z.object({
    type: z.literal('SETTINGS_LOAD'),
    payload: z.object({
      settings: AppSettingsSchema
    })
  })
}

// Root-level action schemas
const RootActionSchemas = {
  REPLACE_ALL: z.object({
    type: z.literal('REPLACE_ALL'),
    payload: z.object({
      exercises: z.object({
        byId: z.record(z.string(), ExerciseSchema),
        allIds: z.array(z.string()),
        loading: z.boolean(),
        error: z.string().nullable()
      }),
      routines: z.object({
        byId: z.record(z.string(), RoutineSchema),
        allIds: z.array(z.string()),
        loading: z.boolean(),
        error: z.string().nullable()
      }),
      planner: z.object({
        plan: PlanSchema,
        currentWeekStartISO: z.string(),
        loading: z.boolean(),
        error: z.string().nullable()
      }),
      logs: z.object({
        byId: z.record(z.string(), LogEntrySchema),
        allIds: z.array(z.string()),
        loading: z.boolean(),
        error: z.string().nullable()
      }),
      settings: z.object({
        preferences: AppSettingsSchema,
        loading: z.boolean(),
        error: z.string().nullable()
      })
    })
  }),
  LOAD_FROM_STORAGE: z.object({
    type: z.literal('LOAD_FROM_STORAGE'),
    payload: z.any() // Allow any for storage loading - will be merged with defaults
  }),
  RECALCULATE_CURRENT_WEEK: z.object({
    type: z.literal('RECALCULATE_CURRENT_WEEK'),
    payload: z.object({})
  })
}

// Combine all action schemas
export const ActionSchemas = {
  ...ExerciseActionSchemas,
  ...RoutineActionSchemas,
  ...PlannerActionSchemas,
  ...LogActionSchemas,
  ...SettingsActionSchemas,
  ...RootActionSchemas
} as const

// Type for action validation result
export interface ActionValidationResult {
  success: boolean
  error?: string
  data?: any
}

// Main validation function
export function validateAction(action: any): ActionValidationResult {
  const actionType = action?.type
  
  if (!actionType || typeof actionType !== 'string') {
    return {
      success: false,
      error: 'Action must have a valid type property'
    }
  }
  
  const schema = ActionSchemas[actionType as keyof typeof ActionSchemas]
  
  if (!schema) {
    return {
      success: false,
      error: `Unknown action type: ${actionType}`
    }
  }
  
  try {
    const result = schema.safeParse(action)
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      }
    } else {
      return {
        success: false,
        error: `Validation failed for ${actionType}: ${result.error.issues.map(i => i.message).join(', ')}`
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Validation error for ${actionType}: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
