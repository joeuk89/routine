/**
 * Development-time prop validation utilities
 * These validations only run in development mode to help catch issues early
 * without affecting production performance.
 */

// Simple development mode detection for prop validation
// For now, always run validation (can be disabled in production builds)
const isDevelopment = true

/**
 * Validates that required function props are provided
 */
export function validateRequiredFunctions(
  componentName: string,
  props: Record<string, any>,
  requiredFunctions: string[]
): void {
  if (!isDevelopment) return

  for (const funcName of requiredFunctions) {
    const func = props[funcName]
    if (func && typeof func !== 'function') {
      console.error(
        `${componentName}: ${funcName} prop must be a function, received ${typeof func}`
      )
    }
  }
}

/**
 * Validates that required props are provided
 */
export function validateRequiredProps(
  componentName: string,
  props: Record<string, any>,
  requiredProps: string[]
): void {
  if (!isDevelopment) return

  for (const propName of requiredProps) {
    if (props[propName] === undefined || props[propName] === null) {
      console.error(
        `${componentName}: ${propName} is a required prop but was not provided`
      )
    }
  }
}

/**
 * Validates that array props are actually arrays
 */
export function validateArrayProps(
  componentName: string,
  props: Record<string, any>,
  arrayProps: string[]
): void {
  if (!isDevelopment) return

  for (const propName of arrayProps) {
    const prop = props[propName]
    if (prop !== undefined && !Array.isArray(prop)) {
      console.error(
        `${componentName}: ${propName} prop must be an array, received ${typeof prop}`
      )
    }
  }
}

/**
 * Comprehensive prop validation for list components
 */
export function validateListComponentProps(
  componentName: string,
  props: Record<string, any>
): void {
  if (!isDevelopment) return

  validateRequiredProps(componentName, props, ['items'])
  validateArrayProps(componentName, props, ['items'])
  
  if (props.actions) {
    const validActionNames = ['onCreate', 'onUpdate', 'onDelete', 'onSelect']
    const providedActions = Object.keys(props.actions)
    
    for (const actionName of providedActions) {
      if (!validActionNames.includes(actionName)) {
        console.warn(
          `${componentName}: Unknown action '${actionName}'. Valid actions are: ${validActionNames.join(', ')}`
        )
      }
    }
    
    validateRequiredFunctions(
      componentName, 
      props.actions, 
      providedActions.filter(name => validActionNames.includes(name))
    )
  }
}

/**
 * Comprehensive prop validation for form components
 */
export function validateFormComponentProps(
  componentName: string,
  props: Record<string, any>
): void {
  if (!isDevelopment) return

  validateRequiredFunctions(componentName, props, ['onSubmit'])
  
  if (props.onCancel) {
    validateRequiredFunctions(componentName, props, ['onCancel'])
  }
}
