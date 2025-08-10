import React from 'react'
import { Button } from '@/components/ui/button'
import { formatDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'

interface PlannerDayProps {
  children: React.ReactNode
  dateISO: string
  dayName: string
  isToday?: boolean
  isFuture?: boolean
  className?: string
}

export function PlannerDay({ 
  children, 
  dateISO, 
  dayName, 
  isToday = false, 
  isFuture = false,
  className 
}: PlannerDayProps) {
  const date = new Date(dateISO + 'T00:00:00Z')
  
  return (
    <div 
      className={cn(
        'border rounded-2xl p-3',
        isToday ? 'border-blue-500 bg-blue-50/50 shadow-sm' : '',
        className
      )}
    >
      {children}
    </div>
  )
}

interface DayHeaderProps {
  dayName: string
  dateISO: string
  isToday?: boolean
  onClear?: () => void
}

PlannerDay.Header = function DayHeader({ 
  dayName, 
  dateISO, 
  isToday = false, 
  onClear 
}: DayHeaderProps) {
  const date = new Date(dateISO + 'T00:00:00Z')
  
  return (
    <div className="flex items-center justify-between mb-2">
      <div className={`font-medium ${isToday ? 'text-blue-700' : ''}`}>
        {dayName} • {formatDayLabel(date)}
        {isToday && (
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            Today
          </span>
        )}
      </div>
      {onClear && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      )}
    </div>
  )
}

interface DayActionsProps {
  children: React.ReactNode
  className?: string
}

PlannerDay.Actions = function DayActions({ children, className }: DayActionsProps) {
  return (
    <div className={cn('flex gap-2 mb-2', className)}>
      {children}
    </div>
  )
}

interface DayContentProps {
  children: React.ReactNode
  minHeight?: string
  className?: string
}

PlannerDay.Content = function DayContent({ 
  children, 
  minHeight = 'min-h-[48px]',
  className 
}: DayContentProps) {
  return (
    <div className={cn('flex flex-col gap-3 p-1', minHeight, className)}>
      {children}
    </div>
  )
}
