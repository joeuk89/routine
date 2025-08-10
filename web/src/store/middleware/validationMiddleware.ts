import type { Dispatch } from 'react'
import { validateAction } from '../validation/actionSchemas'
import type { AppActions } from '../rootReducer'

// Custom middleware type for React useReducer
export type Middleware = (
  dispatch: Dispatch<AppActions>
) => (action: AppActions) => AppActions

/**
 * Validation middleware that checks action payloads before processing
 * Logs validation errors in development and dispatches error actions on failure
 */
export const validationMiddleware: Middleware = (dispatch) => (action) => {
  // Skip validation for certain internal actions that don't need strict validation
  const skipValidationTypes = [
    'LOAD_FROM_STORAGE', // Storage loading uses partial data
    'REPLACE_ALL' // Bulk replacement might have partial data
  ]
  
  if (skipValidationTypes.includes(action.type)) {
    return action
  }
  
  // Validate the action
  const result = validateAction(action)
  
  if (!result.success) {
    console.error('Action validation failed:', {
      action,
      error: result.error
    })
    
    // Log validation errors for debugging
    console.error('❌ Invalid action dispatched:', action)
    console.error('💭 Validation error:', result.error)
    
    // You could throw an error in development to catch validation issues early
    // throw new Error(`Action validation failed: ${result.error}`)
    
    // Create a validation error action instead of processing the invalid action
    const errorAction: AppActions = {
      type: determineErrorActionType(action.type),
      payload: { error: `Validation failed: ${result.error}` }
    } as AppActions
    
    return errorAction
  }
  
  // Validation passed - log success for debugging (can be commented out in production)
  console.debug('✅ Action validated successfully:', action.type)
  
  return action
}

/**
 * Determines the appropriate error action type based on the failed action type
 */
function determineErrorActionType(actionType: string): string {
  if (actionType.startsWith('EXERCISES_')) {
    return 'EXERCISES_SET_ERROR'
  } else if (actionType.startsWith('ROUTINES_')) {
    return 'ROUTINES_SET_ERROR'
  } else if (actionType.startsWith('PLANNER_')) {
    return 'PLANNER_SET_ERROR'
  } else if (actionType.startsWith('LOGS_')) {
    return 'LOGS_SET_ERROR'
  } else if (actionType.startsWith('SETTINGS_')) {
    return 'SETTINGS_SET_ERROR'
  } else {
    // For root-level actions that fail validation, we'll use the exercises error
    // This is a fallback - in practice these should rarely fail validation
    return 'EXERCISES_SET_ERROR'
  }
}

/**
 * Creates an enhanced dispatch function with validation middleware
 */
export function createValidatedDispatch(originalDispatch: Dispatch<AppActions>): Dispatch<AppActions> {
  const middleware = validationMiddleware(originalDispatch)
  
  return (action: AppActions) => {
    const validatedAction = middleware(action)
    return originalDispatch(validatedAction)
  }
}
