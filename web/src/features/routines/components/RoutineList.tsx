import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, List, Edit, Dumbbell, Calendar } from 'lucide-react'
import { useState, memo } from 'react'
import type { Routine } from '../model/types'
import type { Exercise } from '@/features/exercises/model/types'
import { RoutineEditDialog } from './RoutineEditDialog'
import type { ListComponentProps, CRUDActions } from '@/lib/types/componentInterfaces'
import { validateListComponentProps } from '@/lib/utils/propValidation'

/**
 * RoutineList displays a list of workout routines with CRUD operations.
 * 
 * @param items - Array of routines to display
 * @param exercises - Array of exercises for reference
 * @param loading - Whether the list is in loading state
 * @param error - Error message to display if operation failed
 * @param actions - Callback functions for routine operations
 * @param emptyState - Custom component to show when list is empty
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <RoutineList
 *   items={routines}
 *   exercises={exercises}
 *   actions={{
 *     onUpdate: handleUpdateRoutine,
 *     onDelete: handleDeleteRoutine
 *   }}
 * />
 * ```
 */
interface RoutineListProps extends ListComponentProps<Routine> {
  /** Array of exercises for reference */
  exercises: Exercise[]
}

export const RoutineList = memo(function RoutineList({ 
  items,
  exercises, 
  loading = false,
  error = null,
  actions,
  emptyState,
  className 
}: RoutineListProps) {
  // Development-time prop validation
  validateListComponentProps('RoutineList', { items, actions })
  
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)

  // Clean action handlers
  const handleDelete = (id: string) => {
    actions?.onDelete?.(id)
  }

  const handleUpdate = (routine: Routine) => {
    actions?.onUpdate?.(routine)
  }

  // Loading state
  if (loading) {
    return (
      <Card className={`shadow-sm ${className || ''}`}>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Loading routines...</p>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={`shadow-sm ${className || ''}`}>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <Card className={`shadow-sm ${className || ''}`}>
        <CardContent className="p-6 text-center">
          {emptyState || (
            <>
              <List className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-2">No routines yet</h3>
              <p className="text-sm text-muted-foreground">Create your first routine to get started</p>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`shadow-sm ${className || ''}`}>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {items.map((routine, index) => (
            <div 
              key={routine.id} 
              className="group p-4 hover:bg-gray-50/50 transition-colors duration-150"
            >
              <div className="flex items-center justify-between">
                {/* Left side: Color indicator, name, and details */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: routine.color || '#3b82f6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">{routine.name}</h4>
                      <Badge 
                        variant="secondary" 
                        className="text-xs font-normal shrink-0"
                        style={{ 
                          backgroundColor: `${routine.color || '#3b82f6'}08`,
                          color: routine.color || '#3b82f6',
                          border: `1px solid ${routine.color || '#3b82f6'}15`
                        }}
                      >
                        {routine.exerciseIds.length} exercise{routine.exerciseIds.length === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    
                    {routine.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">{routine.description}</p>
                    )}
                    
                    {/* Exercise preview */}
                    <div className="flex flex-wrap gap-1">
                      {routine.exerciseIds.slice(0, 3).map((exerciseId) => {
                        const exercise = exercises.find(e => e.id === exerciseId)
                        return exercise ? (
                          <span 
                            key={exerciseId} 
                            className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
                          >
                            {exercise.name}
                          </span>
                        ) : null
                      })}
                      {routine.exerciseIds.length > 3 && (
                        <span className="text-xs text-gray-400 px-1">
                          +{routine.exerciseIds.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex gap-1 ml-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setEditingRoutine(routine)}
                    className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(routine.id)}
                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <RoutineEditDialog
          open={!!editingRoutine}
          onOpenChange={(open) => !open && setEditingRoutine(null)}
          routine={editingRoutine}
          exercises={exercises}
          onSave={(routine) => {
            handleUpdate(routine)
            setEditingRoutine(null)
          }}
        />
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function to optimize re-renders
  return (
    prevProps.items === nextProps.items &&
    prevProps.exercises === nextProps.exercises &&
    prevProps.loading === nextProps.loading &&
    prevProps.error === nextProps.error &&
    prevProps.actions === nextProps.actions &&
    prevProps.emptyState === nextProps.emptyState &&
    prevProps.className === nextProps.className
  )
})

// Development-only display name
RoutineList.displayName = 'RoutineList'
