import { useEffect, useState, useMemo } from 'react'
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
import type { AppState } from '@/store/rootReducer'
import { actions } from '@/store/actions'

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
  const weekStart = new Date(state.planner.currentWeekStartISO + 'T00:00:00Z')
  const [logTarget, setLogTarget] = useState<{ day: DayKey; dateISO: string; exerciseId: string } | null>(null)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [showRoutineModal, setShowRoutineModal] = useState(false)

  // No longer need ensureWeek - date-based plan handles all dates automatically

  function addExercise(e: ExerciseFormData) {
    dispatch(actions.exercises.add(e as Exercise))
  }
  function removeExercise(id: string) {
    dispatch(actions.exercises.remove(id))
  }
  function editExercise(updated: Exercise) {
    dispatch(actions.exercises.update(updated))
  }
  function addRoutine(r: RoutineFormData) {
    dispatch(actions.routines.add(r as Routine))
  }
  function removeRoutine(id: string) {
    dispatch(actions.routines.remove(id))
  }
  function editRoutine(updated: Routine) {
    dispatch(actions.routines.update(updated))
  }
  function updatePlan(dateISO: string, items: import('@/features/planner/model/plan').PlanItem[]) {
    dispatch(actions.planner.updatePlan(dateISO, items))
  }
  function openLog(dateISO: string, day: DayKey, exerciseId: string) {
    const todayISO = iso(new Date())
    if (dateISO > todayISO) return
    setLogTarget({ day, dateISO, exerciseId })
  }
  function saveLog(payload: LogPayload) {
    if (!logTarget) return
    
    // Check if there's already a log for this exercise on this date
    const logs = state.logs.allIds.map(id => state.logs.byId[id])
    const existingLog = getLogForExerciseOnDate(logs, logTarget.exerciseId, logTarget.dateISO)
    
    if (existingLog) {
      // Update existing log
      dispatch(actions.logs.update(existingLog.id, payload))
      toast.success('Updated workout log')
    } else {
      // Create new log
      const entry: LogEntry = { id: uid(), day: logTarget.day, exerciseId: logTarget.exerciseId, dateISO: logTarget.dateISO, payload }
      dispatch(actions.logs.save(entry))
      toast.success('Logged workout')
    }
    
    setLogTarget(null)
  }
  function exportImportReplace(s: AppState) {
    dispatch(actions.root.replaceAll(s))
  }
  function resetAll() {
    if (confirm('This will erase all exercises, plans, and logs. Continue?')) {
      const today = new Date()
      const currentWeekStart = startOfWeek(today, 'Monday')
      const key = iso(currentWeekStart)
      const resetState: AppState = {
        exercises: { byId: {}, allIds: [], loading: false, error: null },
        routines: { byId: {}, allIds: [], loading: false, error: null },
        planner: { plan: {}, currentWeekStartISO: key, loading: false, error: null },
        logs: { byId: {}, allIds: [], loading: false, error: null },
        settings: { preferences: { defaultUnit: 'KG', weekStartDay: 'Monday' }, loading: false, error: null }
      }
      dispatch(actions.root.replaceAll(resetState))
      toast('Reset complete')
    }
  }
  function connectDriveBeta() {
    toast('Google Drive sync coming soon. We\'ll use Drive API + file picker to save/load JSON.')
  }

  function prevWeek() {
    const prev = addDaysUTC(weekStart, -7)
    const key = iso(prev)
    dispatch(actions.planner.setCurrentWeek(key))
  }
  function nextWeek() {
    const next = addDaysUTC(weekStart, 7)
    const key = iso(next)
    dispatch(actions.planner.setCurrentWeek(key))
  }
  function goToWeekContaining(dateISO: string) {
    const date = new Date(dateISO + 'T00:00:00Z')
    const weekStartDay = state.settings.preferences.weekStartDay || 'Monday'
    const weekStart = startOfWeek(date, weekStartDay)
    const key = iso(weekStart)
    dispatch(actions.planner.setCurrentWeek(key))
  }

  // Calculate the actual dates for the current week
  const settings = state.settings.preferences
  const weekStartDay = settings.weekStartDay || 'Monday'
  // Generate 7 consecutive dates starting from currentWeekStartISO
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDaysUTC(weekStart, i)
    return iso(date)
  })
  const exercises = useMemo(() => 
    state.exercises.allIds.map(id => state.exercises.byId[id]), 
    [state.exercises]
  )
  const logs = useMemo(() => 
    state.logs.allIds.map(id => state.logs.byId[id]), 
    [state.logs]
  )
  const routines = useMemo(() => 
    state.routines.allIds.map(id => state.routines.byId[id]), 
    [state.routines]
  )
  const currentExercise = exercises.find((e) => e.id === logTarget?.exerciseId) || null
  const currentExistingLog = logTarget ? getLogForExerciseOnDate(logs, logTarget.exerciseId, logTarget.dateISO) || null : null

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
          <Planner weekStartISO={state.planner.currentWeekStartISO} plan={state.planner.plan} exercises={exercises} routines={routines} logs={logs} settings={settings} updatePlan={updatePlan} onLog={openLog} onPrevWeek={prevWeek} onNextWeek={nextWeek} onGoToWeek={goToWeekContaining} />
        </TabsContent>
        <TabsContent value="exercises" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Exercises</h2>
            <Button variant="primary-gradient" onClick={() => setShowExerciseModal(true)}>
              Add Exercise
            </Button>
          </div>
          <ExerciseList exercises={exercises} onRemove={removeExercise} onEdit={editExercise} />
        </TabsContent>
        <TabsContent value="routines" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Routines</h2>
            <Button variant="primary-gradient" onClick={() => setShowRoutineModal(true)}>
              Add Routine
            </Button>
          </div>
          <RoutineList routines={routines} exercises={exercises} onRemove={removeRoutine} onEdit={editRoutine} />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <LogsTable logs={logs} exercises={exercises} settings={settings} />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsCard settings={settings} onChange={(s) => dispatch(actions.settings.update(s))} />
        </TabsContent>
      </Tabs>
      <LogDialog
        open={!!logTarget}
        onOpenChange={() => setLogTarget(null)}
        exercise={currentExercise}
        settings={settings}
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
        exercises={exercises}
        onSubmit={addRoutine}
      />
    </div>
  )
}


