import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, GripVertical } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import type { Routine } from '../model/types'
import type { Exercise } from '@/features/exercises/model/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'

function SortableExerciseItem({ exerciseId, exercise, onRemove }: { exerciseId: string; exercise: Exercise; onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exerciseId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-2 bg-white border rounded cursor-move"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 text-gray-400" />
      <span 
        className="inline-block h-3 w-3 rounded flex-shrink-0" 
        style={{ background: exercise.color }} 
      />
      <span className="text-sm flex-1">{exercise.name}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
      >
        ×
      </Button>
    </div>
  )
}

interface RoutineEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routine: Routine | null
  exercises: Exercise[]
  onSave: (routine: Routine) => void
}

export function RoutineEditDialog({ open, onOpenChange, routine, exercises, onSave }: RoutineEditDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([])
  const [color, setColor] = useState('#3b82f6')
  const [searchQuery, setSearchQuery] = useState('')

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter and sort exercises
  const filteredExercises = useMemo(() => {
    return exercises
      .filter(exercise => 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [exercises, searchQuery])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = selectedExerciseIds.indexOf(active.id as string)
      const newIndex = selectedExerciseIds.indexOf(over.id as string)
      
      const newOrder = [...selectedExerciseIds]
      newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, active.id as string)
      
      setSelectedExerciseIds(newOrder)
    }
  }

  // Reset form when routine changes or dialog opens
  useEffect(() => {
    if (routine && open) {
      setName(routine.name)
      setDescription(routine.description || '')
      setSelectedExerciseIds(routine.exerciseIds)
      setColor(routine.color || '#3b82f6')
      setSearchQuery('')
    }
  }, [routine, open])

  function handleSave() {
    if (!routine) return
    if (!name.trim()) return toast('Give the routine a name.')
    if (selectedExerciseIds.length === 0) return toast('Select at least one exercise.')
    
    const updatedRoutine: Routine = {
      ...routine,
      name: name.trim(),
      description: description.trim() || undefined,
      exerciseIds: selectedExerciseIds,
      color
    }
    
    onSave(updatedRoutine)
    onOpenChange(false)
    toast.success('Routine updated!')
  }

  function toggleExercise(exerciseId: string) {
    setSelectedExerciseIds(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    )
  }

  if (!routine) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Routine</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Push Day" />
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                <input className="h-10 w-16 rounded" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                <Input value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Upper body push movements" />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Exercises ({selectedExerciseIds.length} selected)</label>
            
            {/* Search bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
              {exercises.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No exercises available</p>
              ) : filteredExercises.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No exercises match your search</p>
              ) : (
                filteredExercises.map((exercise) => (
                  <label key={exercise.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedExerciseIds.includes(exercise.id)}
                      onChange={() => toggleExercise(exercise.id)}
                      className="rounded"
                    />
                    <span 
                      className="inline-block h-3 w-3 rounded flex-shrink-0" 
                      style={{ background: exercise.color }} 
                    />
                    <span className="text-sm">{exercise.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Selected exercises with drag and drop */}
          {selectedExerciseIds.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Selected Exercises (drag to reorder)</label>
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={selectedExerciseIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {selectedExerciseIds.map((exerciseId) => {
                      const exercise = exercises.find(e => e.id === exerciseId)
                      if (!exercise) return null
                      
                      return (
                        <SortableExerciseItem
                          key={exerciseId}
                          exerciseId={exerciseId}
                          exercise={exercise}
                          onRemove={() => toggleExercise(exerciseId)}
                        />
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
