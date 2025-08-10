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
import { PlannerContainer } from '@/features/planner/containers/PlannerContainer'
import { LogsTable } from '@/features/logs/components/LogsTable'
import { SettingsCard } from '@/features/settings/components/SettingsCard'
import { LogDialog } from '@/features/logs/components/LogDialog'
import { iso, startOfWeek } from '@/lib/date'
import type { DayKey } from '@/lib/date'
import { uid } from '@/lib/id'
import type { LogEntry, LogPayload } from '@/features/logs/model/log'
import { logSelectors, exerciseSelectors } from '@/lib/selectors'
import { useExerciseManager } from '@/features/exercises/hooks/useExerciseManager'
import { toast } from 'sonner'

import type { Exercise } from '@/features/exercises/model/types'
import type { Routine } from '@/features/routines/model/types'
import type { AppState } from '@/store/rootReducer'
import { actions } from '@/store/actions'

// Form data interfaces for better type safety
import type { ExerciseFormData } from '@/features/exercises/hooks/useExerciseForm'

interface RoutineFormData {
  name: string
  description?: string
  exerciseIds: string[]
  color?: string
}

export default function App() {

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
  const exerciseManager = useExerciseManager()
  const [logTarget, setLogTarget] = useState<{ day: DayKey; dateISO: string; exerciseId: string } | null>(null)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [showRoutineModal, setShowRoutineModal] = useState(false)

  // No longer need ensureWeek - date-based plan handles all dates automatically

  function addExercise(exercise: Exercise) {
    // Convert Exercise to ExerciseFormData and call the manager
    const formData: ExerciseFormData = {
      name: exercise.name,
      color: exercise.color,
      type: exercise.type,
      weightUnit: exercise.weightUnit || 'DEFAULT',
      refUrl: exercise.refUrl || ''
    }
    
    exerciseManager.addExercise(formData).catch(() => {
      // Error is already handled by the hook with toast notifications
    })
  }
  async function removeExercise(id: string) {
    try {
      await exerciseManager.deleteExercise(id)
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }
  async function editExercise(updated: Exercise) {
    try {
      const formData = {
        name: updated.name,
        color: updated.color,
        type: updated.type,
        weightUnit: updated.weightUnit || 'DEFAULT',
        refUrl: updated.refUrl || ''
      }
      await exerciseManager.updateExercise(updated.id, formData)
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
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

  function openLog(dateISO: string, day: DayKey, exerciseId: string) {
    const todayISO = iso(new Date())
    if (dateISO > todayISO) return
    setLogTarget({ day, dateISO, exerciseId })
  }
  function saveLog(payload: LogPayload) {
    if (!logTarget) return
    
    // Check if there's already a log for this exercise on this date
    const existingLog = logSelectors.getForDate(state, logTarget.dateISO)
      .find(log => log.exerciseId === logTarget.exerciseId)
    
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



  const exercises = exerciseSelectors.getAll(state)
  const logs = logSelectors.getForDateRange(state, '1900-01-01', '2200-12-31') // Get all logs
  const routines = useMemo(() => 
    state.routines.allIds.map(id => state.routines.byId[id]), 
    [state.routines]
  )
  const settings = state.settings.preferences
  const currentExercise = exercises.find((e) => e.id === logTarget?.exerciseId) || null
  const currentExistingLog = logTarget ? 
    logSelectors.getForDate(state, logTarget.dateISO)
      .find(log => log.exerciseId === logTarget.exerciseId) || null : null

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
          <PlannerContainer onLog={openLog} />
        </TabsContent>
        <TabsContent value="exercises" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Exercises</h2>
            <Button variant="primary-gradient" onClick={() => setShowExerciseModal(true)}>
              Add Exercise
            </Button>
          </div>
          <ExerciseList 
            items={exercises} 
            actions={{
              onUpdate: editExercise,
              onDelete: removeExercise
            }}
          />
        </TabsContent>
        <TabsContent value="routines" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Routines</h2>
            <Button variant="primary-gradient" onClick={() => setShowRoutineModal(true)}>
              Add Routine
            </Button>
          </div>
          <RoutineList 
            items={routines} 
            exercises={exercises} 
            actions={{
              onUpdate: editRoutine,
              onDelete: removeRoutine
            }}
          />
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


