import React from 'react'
import { cn } from '@/lib/utils'

interface FormProps {
  children: React.ReactNode
  onSubmit?: (e: React.FormEvent) => void
  className?: string
}

export function Form({ children, onSubmit, className }: FormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(e)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {children}
    </form>
  )
}

interface FormFieldProps {
  label: string
  error?: string | null
  children: React.ReactNode
  required?: boolean
  className?: string
}

Form.Field = function FormField({ 
  label, 
  error, 
  children, 
  required = false,
  className 
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

interface FormActionsProps {
  children: React.ReactNode
  className?: string
}

Form.Actions = function FormActions({ children, className }: FormActionsProps) {
  return (
    <div className={cn('flex gap-2 justify-end pt-4', className)}>
      {children}
    </div>
  )
}

interface FormGroupProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 6
  className?: string
}

Form.Group = function FormGroup({ 
  children, 
  columns = 1, 
  className 
}: FormGroupProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    6: 'md:grid-cols-6'
  }

  return (
    <div className={cn('grid gap-3', gridCols[columns], className)}>
      {children}
    </div>
  )
}
