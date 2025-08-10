import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { StoreProvider, useStore } from '@/store/context'
import { HeaderBar } from '@/components/common/HeaderBar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { TodayView } from '@/features/today/components/TodayView'
import { ExerciseFormModal } from '@/features/exercises/components/ExerciseFormModal'
import { ExerciseList } from '@/features/exercises/components/ExerciseList'
import { RoutineForm } from '@/features/routines/components/RoutineForm'
import { RoutineList } from '@/features/routines/components/RoutineList'
import { Planner } from '@/features/planner/components/Planner'
import { LogsTable } from '@/features/logs/components/LogsTable'
import { SettingsCard } from '@/features/settings/components/SettingsCard'
import { LogDialog } from '@/features/logs/components/LogDialog'
import { addDaysUTC, iso, startOfWeekMonday, startOfWeek } from '@/lib/date'
import type { DayKey } from '@/lib/date'
import { uid } from '@/lib/id'
import type { LogEntry, LogPayload } from '@/features/logs/model/log'
import { getLogForExerciseOnDate } from '@/lib/metrics'
import { toast } from 'sonner'
import { getPlanItemsForDate, setPlanItemsForDate } from '@/features/planner/model/plan'
import type { Exercise } from '@/features/exercises/model/types'
import type { Routine } from '@/features/routines/model/types'
import type { AppState } from '@/store/state'

// Form data interfaces for better type safety
interface ExerciseFormData {
  name: string
  color: string
  type: import('@/lib/units').ProgressionType
  refUrl?: string
  weightUnit?: import('@/lib/units').WeightUnit
}

interface RoutineFormData {
  name: string
  description?: string
  exerciseIds: string[]
  color?: string
}

export default function App() {
  // Placeholder shell; will be replaced with store + features wiring during migration
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return (
    <StoreProvider>
      <div className="min-h-screen p-4">
        <Toaster richColors position="top-right" />
        {ready && <InnerApp />}
      </div>
    </StoreProvider>
  )
}

function InnerApp() {
  const { state, dispatch } = useStore()
  const weekStart = new Date(state.currentWeekStartISO + 'T00:00:00Z')
  const [logTarget, setLogTarget] = useState<{ day: DayKey; dateISO: string; exerciseId: string } | null>(null)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [showRoutineModal, setShowRoutineModal] = useState(false)

  // No longer need ensureWeek - date-based plan handles all dates automatically

  function addExercise(e: ExerciseFormData) {
    dispatch({ type: 'ADD_EXERCISE', payload: e as Exercise })
  }
  function removeExercise(id: string) {
    dispatch({ type: 'REMOVE_EXERCISE', payload: { id } })
  }
  function editExercise(updated: Exercise) {
    dispatch({ type: 'EDIT_EXERCISE', payload: updated })
  }
  function addRoutine(r: RoutineFormData) {
    dispatch({ type: 'ADD_ROUTINE', payload: r as Routine })
  }
  function removeRoutine(id: string) {
    dispatch({ type: 'REMOVE_ROUTINE', payload: { id } })
  }
  function editRoutine(updated: Routine) {
    dispatch({ type: 'EDIT_ROUTINE', payload: updated })
  }
  function updatePlan(dateISO: string, items: import('@/features/planner/model/plan').PlanItem[]) {
    dispatch({ type: 'UPDATE_PLAN', payload: { dateISO, items } })
  }
  function openLog(dateISO: string, day: DayKey, exerciseId: string) {
    const todayISO = iso(new Date())
    if (dateISO > todayISO) return
    setLogTarget({ day, dateISO, exerciseId })
  }
  function saveLog(payload: LogPayload) {
    if (!logTarget) return
    
    // Check if there's already a log for this exercise on this date
    const existingLog = getLogForExerciseOnDate(state.logs, logTarget.exerciseId, logTarget.dateISO)
    
    if (existingLog) {
      // Update existing log
      dispatch({ type: 'UPDATE_LOG', payload: { id: existingLog.id, payload } })
      toast.success('Updated workout log')
    } else {
      // Create new log
      const entry: LogEntry = { id: uid(), day: logTarget.day, exerciseId: logTarget.exerciseId, dateISO: logTarget.dateISO, payload }
      dispatch({ type: 'SAVE_LOG', payload: { entry } })
      toast.success('Logged workout')
    }
    
    setLogTarget(null)
  }
  function exportImportReplace(s: AppState) {
    dispatch({ type: 'REPLACE_ALL', payload: s })
  }
  function resetAll() {
    if (confirm('This will erase all exercises, plans, and logs. Continue?')) {
      const today = new Date()
      const currentWeekStart = startOfWeek(today, 'Monday')
      const key = iso(currentWeekStart)
      const resetState: AppState = { 
        exercises: [], 
        routines: [], 
        logs: [], 
        settings: { defaultUnit: 'KG', weekStartDay: 'Monday' }, 
        currentWeekStartISO: key, 
        plan: {} 
      }
      dispatch({ type: 'REPLACE_ALL', payload: resetState })
      toast('Reset complete')
    }
  }
  function connectDriveBeta() {
    toast('Google Drive sync coming soon. We\'ll use Drive API + file picker to save/load JSON.')
  }

  function prevWeek() {
    const prev = addDaysUTC(weekStart, -7)
    const key = iso(prev)
    dispatch({ type: 'SET_CURRENT_WEEK', payload: { weekStartISO: key } })
  }
  function nextWeek() {
    const next = addDaysUTC(weekStart, 7)
    const key = iso(next)
    dispatch({ type: 'SET_CURRENT_WEEK', payload: { weekStartISO: key } })
  }
  function goToWeekContaining(dateISO: string) {
    const date = new Date(dateISO + 'T00:00:00Z')
    const weekStartDay = state.settings.weekStartDay || 'Monday'
    const weekStart = startOfWeek(date, weekStartDay)
    const key = iso(weekStart)
    dispatch({ type: 'SET_CURRENT_WEEK', payload: { weekStartISO: key } })
  }

  // Calculate the actual dates for the current week
  const weekStartDay = state.settings.weekStartDay || 'Monday'
  // Generate 7 consecutive dates starting from currentWeekStartISO
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDaysUTC(weekStart, i)
    return iso(date)
  })
  const currentExercise = state.exercises.find((e) => e.id === logTarget?.exerciseId) || null
  const currentExistingLog = logTarget ? getLogForExerciseOnDate(state.logs, logTarget.exerciseId, logTarget.dateISO) || null : null

  return (
    <div className="max-w-7xl mx-auto">
      <HeaderBar state={state} onReset={resetAll} onDrive={connectDriveBeta} onImport={exportImportReplace} />
      <Tabs defaultValue="today" className="mt-4">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="routines">Routines</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-4">
          <TodayView />
        </TabsContent>
        <TabsContent value="plan" className="mt-4">
          <Planner weekStartISO={state.currentWeekStartISO} plan={state.plan} exercises={state.exercises} routines={state.routines} logs={state.logs} settings={state.settings} updatePlan={updatePlan} onLog={openLog} onPrevWeek={prevWeek} onNextWeek={nextWeek} onGoToWeek={goToWeekContaining} />
        </TabsContent>
        <TabsContent value="exercises" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Exercises</h2>
            <Button variant="primary-gradient" onClick={() => setShowExerciseModal(true)}>
              Add Exercise
            </Button>
          </div>
          <ExerciseList exercises={state.exercises} onRemove={removeExercise} onEdit={editExercise} />
        </TabsContent>
        <TabsContent value="routines" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Routines</h2>
            <Button variant="primary-gradient" onClick={() => setShowRoutineModal(true)}>
              Add Routine
            </Button>
          </div>
          <RoutineList routines={state.routines} exercises={state.exercises} onRemove={removeRoutine} onEdit={editRoutine} />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <LogsTable logs={state.logs} exercises={state.exercises} settings={state.settings} />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsCard settings={state.settings} onChange={(s) => dispatch({ type: 'SET_SETTINGS', payload: s })} />
        </TabsContent>
      </Tabs>
      <LogDialog
        open={!!logTarget}
        onOpenChange={() => setLogTarget(null)}
        exercise={currentExercise}
        settings={state.settings}
        day={logTarget?.day || null}
        dateISO={logTarget?.dateISO || null}
        existingLog={currentExistingLog}
        onSave={saveLog}
      />
      
      <ExerciseFormModal
        open={showExerciseModal}
        onOpenChange={setShowExerciseModal}
        onAdd={addExercise}
      />
      
              <RoutineForm
          open={showRoutineModal}
          onOpenChange={setShowRoutineModal}
        exercises={state.exercises}
        onSubmit={addRoutine}
      />
    </div>
  )
}


