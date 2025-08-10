import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ChevronLeft, ChevronRight, History, LinkIcon, Trophy, Trash2, GripVertical } from 'lucide-react'
import type { Plan, PlanItem } from '../model/plan'
import type { Exercise } from '@/features/exercises/model/types'
import type { Routine } from '@/features/routines/model/types'
import type { LogEntry } from '@/features/logs/model/log'
import type { AppSettings } from '@/features/settings/model/settings'
import { addDaysUTC, dayOrder, formatDayLabel, iso } from '@/lib/date'
import { computePB, latestLogForExerciseBeforeDate, getLogForExerciseOnDate, getCurrentProgressDetails } from '@/lib/metrics'
import { getUnitForExercise } from '@/lib/utils'
import { canDragPlanItem, hasLoggedData } from '@/lib/dragUtils'
import { LastSessionPopover } from './LastSessionPopover'
import { AddModal } from './AddModal'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
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
import { useState } from 'react'

// Sortable component for exercises within routines
function SortableRoutineExercise({ 
  id, 
  exercise, 
  exerciseId, 
  exerciseIdx, 
  routineIdx, 
  day, 
  dateISO, 
  isFuture, 
  unit, 
  lastLog, 
  pb, 
  currentLog, 
  currentProgressDetails, 
  logs, 
  onLog, 
  plan, 
  updatePlan, 
  weekStartISO, 
  onGoToWeek 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: hasLoggedData(exerciseId, dateISO, logs)
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const canDrag = !hasLoggedData(exerciseId, dateISO, logs)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-1 rounded-xl border p-2 bg-white"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {canDrag && (
            <div 
              className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 p-1 -ml-1"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <span className="inline-block h-3 w-3 rounded" style={{ background: exercise.color }} />
          <span>{exercise.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={isFuture} onClick={() => onLog(dateISO, day, exerciseId)}>Log</Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => {
              const updatedItems = plan[day].map((planItem: any, planIdx: number) => {
                if (planIdx === routineIdx && planItem.type === 'routine') {
                  const filteredExerciseIds = planItem.exerciseIds.filter((id: string) => id !== exerciseId)
                  return filteredExerciseIds.length > 0 ? {
                    ...planItem,
                    exerciseIds: filteredExerciseIds
                  } : null
                }
                return planItem
              }).filter((item: any) => item !== null)
              updatePlan(day, updatedItems)
            }}
            className="h-8 w-8"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-black/60 flex flex-wrap gap-3 pl-5">
        {exercise.refUrl && (
          <a className="inline-flex items-center underline" href={exercise.refUrl} target="_blank" rel="noreferrer">
            <LinkIcon className="w-3 h-3 mr-1" /> Reference
          </a>
        )}
        <span className="inline-flex items-center"><Trophy className="w-3 h-3 mr-1"/>PB: {pb}</span>
        <LastSessionPopover exercise={exercise} lastLog={lastLog} unit={unit} currentWeekStartISO={weekStartISO} onGoToWeek={onGoToWeek} />
        {isFuture && <span className="text-[10px] uppercase tracking-wide">Future day — logging disabled</span>}
      </div>
      {currentProgressDetails.length > 0 && (
        <div className="pl-5 mt-1">
          <div className="text-xs font-medium text-green-700 mb-1">Today's Session:</div>
          <div className="space-y-1">
            {currentProgressDetails.map((detail: string, detailIdx: number) => (
              <div key={detailIdx} className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                {detail}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Planner({ weekStartISO, plan, exercises, routines, logs, settings, updatePlan, onLog, onPrevWeek, onNextWeek, onGoToWeek }: { weekStartISO: string; plan: Plan; exercises: Exercise[]; routines: Routine[]; logs: LogEntry[]; settings: AppSettings; updatePlan: (day: import('@/lib/date').DayKey, items: PlanItem[]) => void; onLog: (dateISO: string, day: import('@/lib/date').DayKey, exerciseId: string) => void; onPrevWeek: () => void; onNextWeek: () => void; onGoToWeek: (dateISO: string) => void }) {
  const monday = new Date(weekStartISO + 'T00:00:00Z')
  const todayISO = iso(new Date())
  
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Handle routine exercise reordering
    if (activeId.includes('routine') && activeId.includes('exercise')) {
      handleRoutineExerciseReorder(activeId, overId)
      return
    }

    // Handle regular exercise reordering
    const [activeDay, activeIdx] = activeId.split('-')
    const [overDay, overIdx] = overId.split('-')

    if (!activeDay || !overDay || activeIdx === undefined || overIdx === undefined) return
    
    // Only allow reordering within the same day
    if (activeDay !== overDay) return

    const activeItemIndex = parseInt(activeIdx)
    const overItemIndex = parseInt(overIdx)

    // Only proceed if we're actually moving an exercise (not a routine)
    const items = [...plan[activeDay as keyof typeof plan]]
    if (items[activeItemIndex]?.type !== 'exercise') return

    // Reordering within the same day
    const [moved] = items.splice(activeItemIndex, 1)
    items.splice(overItemIndex, 0, moved)
    updatePlan(activeDay as any, items)
  }

  function handleRoutineExerciseReorder(activeId: string, overId: string) {
    // Parse routine exercise IDs: day-routine-routineIdx-exercise-exerciseIdx
    const activeParts = activeId.split('-')
    const overParts = overId.split('-')
    
    if (activeParts.length !== 5 || overParts.length !== 5) return
    
    const activeDay = activeParts[0]
    const activeRoutineIdx = parseInt(activeParts[2])
    const activeExerciseIdx = parseInt(activeParts[4])
    
    const overDay = overParts[0]
    const overRoutineIdx = parseInt(overParts[2])
    const overExerciseIdx = parseInt(overParts[4])
    
    // Only allow reordering within the same routine
    if (activeDay !== overDay || activeRoutineIdx !== overRoutineIdx) return
    
    const items = [...plan[activeDay as keyof typeof plan]]
    const routineItem = items[activeRoutineIdx]
    
    if (!routineItem || routineItem.type !== 'routine') return
    
    const exerciseIds = [...routineItem.exerciseIds]
    const [moved] = exerciseIds.splice(activeExerciseIdx, 1)
    exerciseIds.splice(overExerciseIdx, 0, moved)
    
    const updatedItems = items.map((item, idx) => 
      idx === activeRoutineIdx ? { ...item, exerciseIds } : item
    )
    
    updatePlan(activeDay as any, updatedItems)
  }

  // Create sortable plan item component for individual exercises only
  function SortablePlanItem({ 
    id, 
    item, 
    index, 
    day, 
    dateISO, 
    isFuture 
  }: { 
    id: string
    item: PlanItem
    index: number
    day: string
    dateISO: string
    isFuture: boolean
  }) {
    // Only individual exercises are draggable, not routines
    if (item.type === 'routine') {
      return renderPlanItemContent(item, index, day, dateISO, isFuture)
    }

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ 
      id,
      disabled: !canDragPlanItem(item, dateISO, logs)
    })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    const canDrag = canDragPlanItem(item, dateISO, logs)

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative"
      >
        {renderPlanItemContent(item, index, day, dateISO, isFuture, canDrag, attributes, listeners)}
      </div>
    )
  }

  // Extract the plan item rendering logic
  function renderPlanItemContent(
    item: PlanItem, 
    idx: number, 
    day: string, 
    dateISO: string, 
    isFuture: boolean, 
    canDrag: boolean = false,
    attributes?: any,
    listeners?: any
  ) {
    if (item.type === 'routine') {
      return (
        <div className="space-y-2">
          {/* Routine Header */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border-l-4" style={{ borderLeftColor: item.color || '#3b82f6' }}>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded" style={{ background: item.color || '#3b82f6' }} />
              <span className="font-medium text-sm">{item.name}</span>
              <span className="text-xs text-muted-foreground">({item.exerciseIds.length} exercises)</span>
            </div>
            <Button size="icon" variant="ghost" onClick={() => updatePlan(day as any, plan[day as keyof typeof plan].filter((_, i2) => i2 !== idx))}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Routine Exercises */}
          <SortableContext 
            items={item.exerciseIds.map((exerciseId, exerciseIdx) => `${day}-routine-${idx}-exercise-${exerciseIdx}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="ml-4 space-y-2">
              {item.exerciseIds.map((exerciseId, exerciseIdx) => {
                const ex = exercises.find((e) => e.id === exerciseId)
                if (!ex) return null
                const unit = getUnitForExercise(ex, settings)
                const lastLog = latestLogForExerciseBeforeDate(logs, ex.id, dateISO)
                const pb = computePB(ex, logs, unit)
                const currentLog = getLogForExerciseOnDate(logs, ex.id, dateISO)
                const currentProgressDetails = getCurrentProgressDetails(ex, currentLog, unit)
                
                return (
                  <SortableRoutineExercise
                    key={exerciseId}
                    id={`${day}-routine-${idx}-exercise-${exerciseIdx}`}
                    exercise={ex}
                    exerciseId={exerciseId}
                    exerciseIdx={exerciseIdx}
                    routineIdx={idx}
                    day={day}
                    dateISO={dateISO}
                    isFuture={isFuture}
                    unit={unit}
                    lastLog={lastLog}
                    pb={pb}
                    currentLog={currentLog}
                    currentProgressDetails={currentProgressDetails}
                    logs={logs}
                    onLog={onLog}
                    plan={plan}
                    updatePlan={updatePlan}
                    weekStartISO={weekStartISO}
                    onGoToWeek={onGoToWeek}
                  />
                )
              })}
            </div>
          </SortableContext>
        </div>
      )
    } else {
      // Individual exercise
      const ex = exercises.find((e) => e.id === item.id)
      if (!ex) return null
      const unit = getUnitForExercise(ex, settings)
      const lastLog = latestLogForExerciseBeforeDate(logs, ex.id, dateISO)
      const pb = computePB(ex, logs, unit)
      const currentLog = getLogForExerciseOnDate(logs, ex.id, dateISO)
      const currentProgressDetails = getCurrentProgressDetails(ex, currentLog, unit)
      
      return (
        <div className="flex flex-col gap-1 rounded-xl border p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {canDrag && (
                <div 
                  className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 p-1 -ml-1"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <span className="inline-block h-3 w-3 rounded" style={{ background: ex.color }} />
              <span>{ex.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={isFuture} onClick={() => onLog(dateISO, day as any, ex.id)}>Log</Button>
              <Button size="icon" variant="ghost" onClick={() => updatePlan(day as any, plan[day as keyof typeof plan].filter((_, i2) => i2 !== idx))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-xs text-black/60 flex flex-wrap gap-3 pl-5">
            {ex.refUrl && (
              <a className="inline-flex items-center underline" href={ex.refUrl} target="_blank" rel="noreferrer">
                <LinkIcon className="w-3 h-3 mr-1" /> Reference
              </a>
            )}
            <span className="inline-flex items-center"><Trophy className="w-3 h-3 mr-1"/>PB: {pb}</span>
            <LastSessionPopover exercise={ex} lastLog={lastLog} unit={unit} currentWeekStartISO={weekStartISO} onGoToWeek={onGoToWeek} />
            {isFuture && <span className="text-[10px] uppercase tracking-wide">Future day — logging disabled</span>}
          </div>
          {currentProgressDetails.length > 0 && (
            <div className="pl-5 mt-1">
              <div className="text-xs font-medium text-green-700 mb-1">Today's Session:</div>
              <div className="space-y-1">
                {currentProgressDetails.map((detail, detailIdx) => (
                  <div key={detailIdx} className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <h2 className="font-semibold">Week Plan</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={onPrevWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-sm text-black/60">{formatDayLabel(monday)} – {formatDayLabel(addDaysUTC(monday, 6))}</div>
              <Button variant="outline" size="icon" onClick={onNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dayOrder.map((day, i) => {
              const date = addDaysUTC(monday, i)
              const dateISO = iso(date)
              const isFuture = dateISO > todayISO
              const dayItems = plan[day] || []
              
              return (
                <div key={day} className="border rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{day} • {formatDayLabel(date)}</div>
                    <Button variant="ghost" size="sm" onClick={() => updatePlan(day, [])}>Clear</Button>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <AddModal
                      exercises={exercises}
                      routines={routines}
                      onAddExercise={(exerciseId) => updatePlan(day, [...dayItems, { type: 'exercise', id: exerciseId }])}
                      onAddRoutine={(routineId) => {
                        const routine = routines.find(r => r.id === routineId)
                        if (routine) {
                          updatePlan(day, [...dayItems, { 
                            type: 'routine', 
                            name: routine.name,
                            color: routine.color || '#3b82f6',
                            exerciseIds: routine.exerciseIds 
                          }])
                        }
                      }}
                    />
                  </div>
                  <SortableContext 
                    items={dayItems
                      .map((item, idx) => item.type === 'exercise' ? `${day}-${idx}` : null)
                      .filter(Boolean) as string[]
                    } 
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2 min-h-[48px]">
                      {dayItems.map((item, idx) => (
                        <SortablePlanItem
                          key={`${day}-${idx}`}
                          id={`${day}-${idx}`}
                          item={item}
                          index={idx}
                          day={day}
                          dateISO={dateISO}
                          isFuture={isFuture}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </DndContext>
  )
}
