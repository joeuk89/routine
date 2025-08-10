import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ChevronLeft, ChevronRight, History, LinkIcon, Trophy, Trash2, GripVertical } from 'lucide-react'
import type { Plan, PlanItem } from '../model/plan'
import type { Exercise } from '@/features/exercises/model/types'
import type { Routine } from '@/features/routines/model/types'
import type { LogEntry } from '@/features/logs/model/log'
import type { AppSettings } from '@/features/settings/model/settings'
import { addDaysUTC, dayOrder, formatDayLabel, iso, startOfWeekMonday, startOfWeek, getDayOrder, getDateForDayInWeek, type DayKey } from '@/lib/date'
import { getPlanItemsForDate } from '@/features/planner/model/plan'
import { MetricsService } from '@/lib/services/MetricsService'
import { logSelectors } from '@/lib/selectors'
import { getUnitForExercise } from '@/lib/utils'
import type { MassUnit } from '@/lib/units'
import { LastSessionPopover } from './LastSessionPopover'
import { AddModal } from './AddModal'
import { PlannerDay } from './PlannerDay'
import {
  DndContext,
  closestCenter,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
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
import { useState, memo } from 'react'
import type { PlannerData } from '../hooks/usePlannerData'
import type { PlannerActions } from '../hooks/usePlannerActions'

// Simplified drag preview component
const DragPreview = memo(function DragPreview({ item, exercises }: { item: PlanItem; exercises: Exercise[] }) {
  if (item.type === 'routine') {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded" style={{ background: item.color }} />
        <span className="font-medium text-sm">{item.name}</span>
        <span className="text-xs text-gray-500">({item.exerciseIds.length} exercises)</span>
      </div>
    )
  } else {
    const exercise = exercises.find(e => e.id === item.id)
    if (!exercise) return null
    
    return (
      <div className="bg-white border-2 border-gray-300 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded" style={{ background: exercise.color }} />
        <span className="font-medium text-sm">{exercise.name}</span>
      </div>
    )
  }
})

// Simplified bar component for drag mode
const SimplifiedBar = memo(function SimplifiedBar({ item, exercises }: { item: PlanItem; exercises: Exercise[] }) {
  if (item.type === 'routine') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded" style={{ background: item.color }} />
        <span className="font-medium text-sm">{item.name}</span>
        <span className="text-xs text-gray-500">({item.exerciseIds.length} exercises)</span>
      </div>
    )
  } else {
    const exercise = exercises.find(e => e.id === item.id)
    if (!exercise) return null
    
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded" style={{ background: exercise.color }} />
        <span className="font-medium text-sm">{exercise.name}</span>
      </div>
    )
  }
})

export interface PlannerPresenterProps {
  data: PlannerData
  actions: PlannerActions
}

export const PlannerPresenter = memo(function PlannerPresenter({ data, actions }: PlannerPresenterProps) {
  const { weekStartISO, plan, exercises, routines, logs, settings } = data
  const { onPlanUpdate, onLogExercise, onWeekNavigate } = actions
  
  const weekStart = new Date(weekStartISO + 'T00:00:00Z')
  const todayISO = iso(new Date())
  const weekStartDay = settings.weekStartDay || 'Monday'
  const thisWeekStart = startOfWeek(new Date(), weekStartDay)
  const thisWeekStartISO = iso(thisWeekStart)
  const customDayOrder = getDayOrder(weekStartDay)
  
  // Function to go to current week
  const goToThisWeek = () => {
    onWeekNavigate('goto', thisWeekStartISO)
  }

  // Helper function to convert logical day name to actual dateISO for current week
  const getDateISOForDay = (dayName: string): string => {
    return getDateForDayInWeek(weekStartISO, dayName as DayKey, weekStartDay)
  }
  
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<PlanItem | null>(null)
  const [dragMode, setDragMode] = useState<'top-level' | 'within-routine' | null>(null)
  const [activeDragDay, setActiveDragDay] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragStart(event: DragStartEvent) {
    const activeId = event.active.id as string
    setActiveId(activeId)
    
    // Extract the day from the active ID
    const day = activeId.split('-')[0]
    setActiveDragDay(day)
    
    // Determine drag mode and find the active item
    if (activeId.includes('routine') && activeId.includes('exercise')) {
      // Exercise within routine - within-routine drag mode
      setDragMode('within-routine')
      const parts = activeId.split('-')
      const routineIdx = parseInt(parts[2])
      const exerciseIdx = parseInt(parts[4])
      const routine = plan[day as keyof typeof plan]?.[routineIdx]
      if (routine && routine.type === 'routine') {
        const exerciseId = routine.exerciseIds[exerciseIdx]
        const exercise = exercises.find(e => e.id === exerciseId)
        if (exercise) {
          setActiveItem({ type: 'exercise', id: exerciseId })
        }
      }
    } else {
      // Top-level item (exercise or routine) - top-level drag mode
      setDragMode('top-level')
      const [, idx] = activeId.split('-')
      const item = plan[day as keyof typeof plan]?.[parseInt(idx)]
      if (item) {
        setActiveItem(item)
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setActiveItem(null)
    setDragMode(null)
    setActiveDragDay(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Handle routine exercise reordering (exercises within routines)
    if (activeId.includes('routine') && activeId.includes('exercise')) {
      handleRoutineExerciseReorder(activeId, overId)
      return
    }

    // Handle regular plan item reordering (both exercises and routines at top level)
    const [activeDay, activeIdx] = activeId.split('-')
    const [overDay, overIdx] = overId.split('-')

    if (!activeDay || !overDay || activeIdx === undefined || overIdx === undefined) return
    
    // Only allow reordering within the same day
    if (activeDay !== overDay) return

    const activeItemIndex = parseInt(activeIdx)
    const overItemIndex = parseInt(overIdx)

    // Reordering within the same day (both exercises and routines)
    const activeDateISO = getDateISOForDay(activeDay)
    const items = [...getPlanItemsForDate(plan, activeDateISO)]
    const [moved] = items.splice(activeItemIndex, 1)
    items.splice(overItemIndex, 0, moved)
    onPlanUpdate(activeDateISO, items)
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
    
    const activeDateISO = getDateISOForDay(activeDay)
    const items = [...getPlanItemsForDate(plan, activeDateISO)]
    const routineItem = items[activeRoutineIdx]
    
    if (!routineItem || routineItem.type !== 'routine') return
    
    const exerciseIds = [...routineItem.exerciseIds]
    const [moved] = exerciseIds.splice(activeExerciseIdx, 1)
    exerciseIds.splice(overExerciseIdx, 0, moved)
    
    const updatedItems = items.map((item, idx) => 
      idx === activeRoutineIdx ? { ...item, exerciseIds } : item
    )
    
    onPlanUpdate(activeDateISO, updatedItems)
  }

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
    weekStartDay,
    onGoToWeek,
    dragMode,
    activeId,
    activeDragDay
  }: {
    id: string
    exercise: Exercise
    exerciseId: string
    exerciseIdx: number
    routineIdx: number
    day: string
    dateISO: string
    isFuture: boolean
    unit: MassUnit
    lastLog: LogEntry | undefined
    pb: string
    currentLog: LogEntry | undefined
    currentProgressDetails: string[]
    logs: LogEntry[]
    onLog: (dateISO: string, day: DayKey, exerciseId: string) => void
    plan: Plan
    updatePlan: (dateISO: string, items: PlanItem[]) => void
    weekStartISO: string
    weekStartDay: DayKey
    onGoToWeek: (dateISO: string) => void
    dragMode: 'top-level' | 'within-routine' | null
    activeId: string | null
    activeDragDay: string | null
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ 
      id,
      disabled: false // Allow all exercises within routines to be dragged
    })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    const canDrag = true // Allow all exercises within routines to be dragged

    // Show simplified bar in within-routine drag mode only for the active drag day
    if (dragMode === 'within-routine' && activeId && activeDragDay === day) {
      return (
        <div
          ref={setNodeRef}
          style={style}
          className="relative"
        >
          <SimplifiedBar item={{ type: 'exercise', id: exerciseId }} exercises={[exercise]} />
        </div>
      )
    }

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
            <Button size="sm" variant="outline" disabled={isFuture} onClick={() => onLog(dateISO, day as DayKey, exerciseId)}>Log</Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => {
                const currentItems = getPlanItemsForDate(plan, dateISO)
                const updatedItems = currentItems.map((planItem: PlanItem, planIdx: number) => {
                  if (planIdx === routineIdx && planItem.type === 'routine') {
                    const filteredExerciseIds = planItem.exerciseIds.filter((id: string) => id !== exerciseId)
                    return filteredExerciseIds.length > 0 ? {
                      ...planItem,
                      exerciseIds: filteredExerciseIds
                    } : null
                  }
                  return planItem
                }).filter((item: PlanItem | null): item is PlanItem => item !== null)
                onPlanUpdate(dateISO, updatedItems)
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
          <LastSessionPopover exercise={exercise} lastLog={lastLog} unit={unit} currentWeekStartISO={weekStartISO} weekStartDay={weekStartDay} onGoToWeek={onGoToWeek} />
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

  // Create sortable plan item component for both exercises and routines
  function SortablePlanItem({ 
    id, 
    item, 
    index, 
    day, 
    dateISO, 
    isFuture,
    dragMode,
    activeId,
    activeDragDay 
  }: { 
    id: string
    item: PlanItem
    index: number
    day: string
    dateISO: string
    isFuture: boolean
    dragMode: 'top-level' | 'within-routine' | null
    activeId: string | null
    activeDragDay: string | null
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ 
      id,
      disabled: false // Allow all items to be dragged since we only allow same-day reordering
    })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    const canDrag = true // Allow all items to be dragged within the same day

    // Show simplified bar in top-level drag mode only for the active drag day
    if (dragMode === 'top-level' && activeId && activeDragDay === day) {
      return (
        <div
          ref={setNodeRef}
          style={style}
          className="relative"
        >
          <SimplifiedBar item={item} exercises={exercises} />
        </div>
      )
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative"
      >
        {renderPlanItemContent(item, index, day, dateISO, isFuture, dragMode, activeId, canDrag, attributes, listeners)}
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
    dragMode: 'top-level' | 'within-routine' | null,
    activeId: string | null,
    canDrag: boolean = false,
    attributes?: any,
    listeners?: any
  ) {
    if (item.type === 'routine') {
      return (
        <div className="space-y-3">
          {/* Routine Header */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border-l-4" style={{ borderLeftColor: item.color || '#3b82f6' }}>
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
              <span className="inline-block h-3 w-3 rounded" style={{ background: item.color || '#3b82f6' }} />
              <span className="font-medium text-sm">{item.name}</span>
              <span className="text-xs text-muted-foreground">({item.exerciseIds.length} exercises)</span>
            </div>
            <Button size="icon" variant="ghost" onClick={() => {
              const currentItems = getPlanItemsForDate(plan, dateISO)
              onPlanUpdate(dateISO, currentItems.filter((_, i2) => i2 !== idx))
            }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Routine Exercises */}
          <SortableContext 
            items={item.exerciseIds.map((exerciseId, exerciseIdx) => `${day}-routine-${idx}-exercise-${exerciseIdx}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="ml-4 space-y-3 pt-2 pb-1">
              {item.exerciseIds.map((exerciseId, exerciseIdx) => {
                const ex = exercises.find((e) => e.id === exerciseId)
                if (!ex) return null
                const unit = getUnitForExercise(ex, settings)
                const lastLog = MetricsService.getLatestLogBeforeDate(logs, ex.id, dateISO)
                const pb = MetricsService.formatPersonalBest(ex, logs, unit)
                const currentLog = MetricsService.getLogOnDate(logs, ex.id, dateISO)
                const currentProgressDetails = MetricsService.getCurrentProgressDetails(ex, currentLog, unit)
                
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
                    onLog={onLogExercise}
                    plan={plan}
                    updatePlan={onPlanUpdate}
                    weekStartISO={weekStartISO}
                    weekStartDay={weekStartDay}
                    onGoToWeek={(dateISO) => onWeekNavigate('goto', dateISO)}
                    dragMode={dragMode}
                    activeId={activeId}
                    activeDragDay={activeDragDay}
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
      const lastLog = MetricsService.getLatestLogBeforeDate(logs, ex.id, dateISO)
      const pb = MetricsService.formatPersonalBest(ex, logs, unit)
      const currentLog = MetricsService.getLogOnDate(logs, ex.id, dateISO)
      const currentProgressDetails = MetricsService.getCurrentProgressDetails(ex, currentLog, unit)
      
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
              <Button size="sm" variant="outline" disabled={isFuture} onClick={() => onLogExercise(dateISO, day as DayKey, ex.id)}>Log</Button>
              <Button size="icon" variant="ghost" onClick={() => {
                const currentItems = getPlanItemsForDate(plan, dateISO)
                onPlanUpdate(dateISO, currentItems.filter((_, i2) => i2 !== idx))
              }}>
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
            <LastSessionPopover exercise={ex} lastLog={lastLog} unit={unit} currentWeekStartISO={weekStartISO} weekStartDay={weekStartDay} onGoToWeek={(dateISO) => onWeekNavigate('goto', dateISO)} />
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
      collisionDetection={closestCorners}
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
              {weekStartISO !== thisWeekStartISO && (
                <Button variant="outline" size="sm" onClick={goToThisWeek}>
                  This Week
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={() => onWeekNavigate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-sm text-black/60">{formatDayLabel(weekStart)} – {formatDayLabel(addDaysUTC(weekStart, 6))}</div>
              <Button variant="outline" size="icon" onClick={() => onWeekNavigate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {customDayOrder.map((day, i) => {
              const dateISO = getDateForDayInWeek(weekStartISO, day, weekStartDay)
              const date = new Date(dateISO + 'T00:00:00Z')
              const isFuture = dateISO > todayISO
              const isToday = dateISO === todayISO
              const dayItems = getPlanItemsForDate(plan, dateISO)
              
              return (
                <PlannerDay 
                  key={day} 
                  dateISO={dateISO}
                  dayName={day}
                  isToday={isToday}
                  isFuture={isFuture}
                >
                  <PlannerDay.Header 
                    dayName={day}
                    dateISO={dateISO}
                    isToday={isToday}
                    onClear={() => onPlanUpdate(dateISO, [])}
                  />
                  
                  <PlannerDay.Actions>
                    <AddModal
                      exercises={exercises}
                      routines={routines}
                      onAddExercise={(exerciseId) => onPlanUpdate(dateISO, [...dayItems, { type: 'exercise', id: exerciseId }])}
                      onAddRoutine={(routineId) => {
                        const routine = routines.find(r => r.id === routineId)
                        if (routine) {
                          onPlanUpdate(dateISO, [...dayItems, { 
                            type: 'routine', 
                            name: routine.name,
                            color: routine.color || '#3b82f6',
                            exerciseIds: routine.exerciseIds 
                          }])
                        }
                      }}
                    />
                  </PlannerDay.Actions>
                  
                  <SortableContext 
                    items={dayItems.map((_, idx) => `${day}-${idx}`)} 
                    strategy={verticalListSortingStrategy}
                  >
                    <PlannerDay.Content>
                      {dayItems.map((item, idx) => (
                        <SortablePlanItem
                          key={`${day}-${idx}`}
                          id={`${day}-${idx}`}
                          item={item}
                          index={idx}
                          day={day}
                          dateISO={dateISO}
                          isFuture={isFuture}
                          dragMode={dragMode}
                          activeId={activeId}
                          activeDragDay={activeDragDay}
                        />
                      ))}
                    </PlannerDay.Content>
                  </SortableContext>
                </PlannerDay>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      <DragOverlay dropAnimation={null}>
        {activeItem ? <DragPreview item={activeItem} exercises={exercises} /> : null}
      </DragOverlay>
    </DndContext>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function to optimize re-renders for complex planner
  return (
    prevProps.data.weekStartISO === nextProps.data.weekStartISO &&
    prevProps.data.plan === nextProps.data.plan &&
    prevProps.data.exercises === nextProps.data.exercises &&
    prevProps.data.routines === nextProps.data.routines &&
    prevProps.data.logs === nextProps.data.logs &&
    prevProps.data.settings === nextProps.data.settings &&
    prevProps.actions.onPlanUpdate === nextProps.actions.onPlanUpdate &&
    prevProps.actions.onLogExercise === nextProps.actions.onLogExercise &&
    prevProps.actions.onWeekNavigate === nextProps.actions.onWeekNavigate
  )
})
