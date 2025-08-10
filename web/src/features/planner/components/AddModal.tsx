import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Dumbbell, List } from 'lucide-react'
import type { Exercise } from '@/features/exercises/model/types'
import type { Routine } from '@/features/routines/model/types'
import { useState } from 'react'

interface AddModalProps {
  exercises: Exercise[]
  routines: Routine[]
  onAddExercise: (exerciseId: string) => void
  onAddRoutine: (routineId: string) => void
}

export function AddModal({ exercises, routines, onAddExercise, onAddRoutine }: AddModalProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'main' | 'exercises' | 'routines'>('main')

  function handleAddExercise(exerciseId: string) {
    onAddExercise(exerciseId)
    setOpen(false)
    setView('main')
  }

  function handleAddRoutine(routineId: string) {
    onAddRoutine(routineId)
    setOpen(false)
    setView('main')
  }

  function renderMainView() {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">What would you like to add?</p>
        <div className="grid gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button 
                    variant="outline" 
                    onClick={() => (exercises?.length || 0) > 0 && setView('exercises')}
                    disabled={(exercises?.length || 0) === 0}
                    className="h-16 flex flex-col items-center justify-center gap-2 w-full"
                  >
                    <Dumbbell className="w-6 h-6" />
                    <span>Exercise</span>
                  </Button>
                </div>
              </TooltipTrigger>
              {(exercises?.length || 0) === 0 && (
                <TooltipContent className="bg-gray-900 text-white border-gray-700">
                  <p>Create an exercise first in the Exercises tab</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button 
                    variant="outline" 
                    onClick={() => (routines?.length || 0) > 0 && setView('routines')}
                    disabled={(routines?.length || 0) === 0}
                    className="h-16 flex flex-col items-center justify-center gap-2 w-full"
                  >
                    <List className="w-6 h-6" />
                    <span>Routine</span>
                  </Button>
                </div>
              </TooltipTrigger>
              {(routines?.length || 0) === 0 && (
                <TooltipContent className="bg-gray-900 text-white border-gray-700">
                  <p>Create a routine first in the Exercises tab</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    )
  }

  function renderExercisesView() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Select Exercise</h3>
          <Button variant="ghost" size="sm" onClick={() => setView('main')}>
            Back
          </Button>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {(exercises || []).map((exercise) => (
            <Button
              key={exercise.id}
              variant="outline"
              onClick={() => handleAddExercise(exercise.id)}
              className="w-full justify-start gap-3 h-12"
            >
              <span 
                className="inline-block h-4 w-4 rounded flex-shrink-0" 
                style={{ background: exercise.color }} 
              />
              <span>{exercise.name}</span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  function renderRoutinesView() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Select Routine</h3>
          <Button variant="ghost" size="sm" onClick={() => setView('main')}>
            Back
          </Button>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {(routines || []).map((routine) => (
            <Button
              key={routine.id}
              variant="outline"
              onClick={() => handleAddRoutine(routine.id)}
              className="w-full justify-start gap-3 h-auto min-h-12 py-3"
            >
              <span 
                className="inline-block h-4 w-4 rounded flex-shrink-0 mt-0.5" 
                style={{ background: routine.color || '#22c55e' }} 
              />
              <div className="text-left flex-1">
                <div className="font-medium">{routine.name}</div>
                {routine.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {routine.description}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {routine.exerciseIds.length} exercise{routine.exerciseIds.length === 1 ? '' : 's'}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <Button variant="primary-gradient" size="sm" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-1" />
        Add
      </Button>
      
      <Dialog open={open} onOpenChange={(open) => { setOpen(open); if (!open) setView('main') }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Day</DialogTitle>
          </DialogHeader>
          
          {view === 'main' && renderMainView()}
          {view === 'exercises' && renderExercisesView()}
          {view === 'routines' && renderRoutinesView()}
        </DialogContent>
      </Dialog>
    </>
  )
}
