/**
 * Standard component interface patterns for consistent prop naming and structure
 * 
 * This file establishes standardized prop interfaces across the application
 * to improve consistency, discoverability, and maintainability.
 */

import type { ReactNode } from 'react'

/**
 * Standard CRUD action callbacks with consistent naming
 */
export interface CRUDActions<T> {
  /** Called when creating a new item */
  onCreate?: (item: T) => void
  /** Called when updating an existing item */
  onUpdate?: (item: T) => void  
  /** Called when deleting an item by ID */
  onDelete?: (id: string) => void
  /** Called when selecting/clicking on an item */
  onSelect?: (item: T) => void
}

/**
 * Standard loading state interface
 */
export interface LoadingState {
  /** Whether the component is in loading state */
  loading?: boolean
  /** Error message to display if operation failed */
  error?: string | null
}

/**
 * Standard list component props with consistent structure
 */
export interface ListComponentProps<T> extends LoadingState {
  /** Array of items to display */
  items: T[]
  /** CRUD action callbacks */
  actions?: CRUDActions<T>
  /** Custom render function for items (optional) */
  renderItem?: (item: T) => ReactNode
  /** Custom component to show when list is empty */
  emptyState?: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Standard form component props
 */
export interface FormComponentProps<T> extends LoadingState {
  /** Initial data for the form (for editing) */
  initialData?: T
  /** Called when form is submitted successfully */
  onSubmit: (data: T) => void
  /** Called when form is cancelled */
  onCancel?: () => void
  /** Label for the submit button */
  submitLabel?: string
  /** Label for the cancel button */
  cancelLabel?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Standard data and actions pattern for complex components
 */
export interface DataActionsProps<TData, TActions> {
  /** All data needed by the component */
  data: TData
  /** All action callbacks for the component */
  actions: TActions
}

/**
 * Standard component configuration props
 */
export interface ComponentConfig {
  /** Whether the component is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
  /** Data test ID for testing */
  testId?: string
}

/**
 * Standard modal/dialog props
 */
export interface ModalProps extends ComponentConfig {
  /** Whether the modal is open */
  open: boolean
  /** Called when modal should close */
  onOpenChange: (open: boolean) => void
  /** Modal title */
  title?: string
  /** Modal content */
  children: ReactNode
}
