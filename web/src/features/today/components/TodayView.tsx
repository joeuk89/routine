import { useMemo, useState } from 'react'
import { LogDialog } from '@/features/logs/components/LogDialog'
import { AddModal } from '@/features/planner/components/AddModal'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '../../../components/ui/checkbox'
import { Dumbbell, Calendar, CheckCircle2 } from 'lucide-react'
import { useStore } from '@/store/context'
import { actions } from '@/store/actions'
import { iso, formatDayLabel, addDaysUTC } from '@/lib/date'
import { MetricsService } from '@/lib/services/MetricsService'
import { uid } from '@/lib/id'
import type { Exercise } from '@/features/exercises/model/types'
import type { LogEntry } from '@/features/logs/model/log'
import type { PlanItem } from '@/features/planner/model/plan'
import { getPlanItemsForDate } from '@/features/planner/model/plan'

export function TodayView() {
  const { state, dispatch } = useStore()
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
  const plan = state.planner.plan
  const settings = state.settings.preferences
  const [logTarget, setLogTarget] = useState<{ exercise: Exercise; currentLog: LogEntry | null } | null>(null)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())

  const today = useMemo(() => {
    const now = new Date()
    return iso(now)
  }, [])

  const todayDayKey = useMemo(() => {
    const date = new Date(today)
    return date.getDay() === 0 ? 'Sunday' : 
           date.getDay() === 1 ? 'Monday' :
           date.getDay() === 2 ? 'Tuesday' :
           date.getDay() === 3 ? 'Wednesday' :
           date.getDay() === 4 ? 'Thursday' :
           date.getDay() === 5 ? 'Friday' : 'Saturday'
  }, [today])

  const todayPlan = getPlanItemsForDate(plan, today)

  const updateTodayPlan = (items: PlanItem[]) => {
    dispatch(actions.planner.updatePlan(today, items))
  }

  const onAddExercise = (exerciseId: string) => {
    updateTodayPlan([...todayPlan, { type: 'exercise', id: exerciseId }])
  }

  const onAddRoutine = (routineId: string) => {
    const routine = state.routines.byId[routineId]
    if (!routine) return
    
    updateTodayPlan([...todayPlan, {
      type: 'routine',
      name: routine.name,
      color: routine.color || '#3b82f6',
      exerciseIds: routine.exerciseIds
    }])
  }

  const exerciseById = useMemo(() => {
    return Object.fromEntries(exercises.map(ex => [ex.id, ex]))
  }, [exercises])

  const toggleExerciseCompletion = (exerciseId: string) => {
    console.log('Toggling completion for:', exerciseId)
    setCompletedExercises(prev => {
      const newSet = new Set(prev)
      if (newSet.has(exerciseId)) {
        console.log('Removing from completed')
        newSet.delete(exerciseId)
      } else {
        console.log('Adding to completed')
        newSet.add(exerciseId)
      }
      return newSet
    })
  }

  const renderExerciseCard = (exercise: Exercise) => {
    const safelogs = logs || []
    const pb = MetricsService.formatPersonalBest(exercise, safelogs, settings.defaultUnit)
    const lastLog = MetricsService.getLatestLogBeforeDate(safelogs, exercise.id, today)
    const currentLog = MetricsService.getLogOnDate(safelogs, exercise.id, today)
    const currentProgressDetails = MetricsService.getCurrentProgressDetails(exercise, currentLog, settings.defaultUnit)
    const lastSessionDetails = MetricsService.getCurrentProgressDetails(exercise, lastLog, settings.defaultUnit)
    const isCompleted = completedExercises.has(exercise.id)
    const setsCount = currentProgressDetails.length

    // Simplified completed view
    if (isCompleted) {
      return (
        <Card key={exercise.id} className="p-4 bg-green-50 border-2 border-green-200 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl text-green-600" style={{ filter: 'grayscale(100%) brightness(1.2)' }}>
                💪
              </span>
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: exercise.color }}
              />
              <span className="text-lg font-semibold text-green-800">{exercise.name}</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {setsCount} set{setsCount !== 1 ? 's' : ''} completed
              </Badge>
            </div>
            <Checkbox 
              id={`checkbox-completed-${exercise.id}`}
              checked={true}
              onCheckedChange={() => toggleExerciseCompletion(exercise.id)}
              className="h-5 w-5"
            />
          </div>
        </Card>
      )
    }

    // Full exercise card view
    return (
      <Card key={exercise.id} className="p-8 bg-white border-2 hover:shadow-lg transition-all duration-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-6 h-6 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: exercise.color }}
            />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{exercise.name}</h3>
              <Badge variant="secondary" className="mt-2 text-sm">
                {exercise.type.replace(/_/g, ' ').toLowerCase()}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label 
              className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer select-none"
              htmlFor={`checkbox-${exercise.id}`}
            >
              <Checkbox 
                id={`checkbox-${exercise.id}`}
                checked={false}
                onCheckedChange={() => toggleExerciseCompletion(exercise.id)}
                className="h-5 w-5"
              />
              Mark Complete
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1">Personal Best</div>
              <div className="text-xl font-bold text-green-600">{pb || 'No data'}</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-bold text-blue-800">Last Session</h4>
                {lastSessionDetails.length > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                    {lastSessionDetails.length} set{lastSessionDetails.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              {lastLog && (
                <div className="text-xs font-medium text-blue-600 mb-3 ml-9">
                  {formatDayLabel(new Date(lastLog.dateISO))}
                </div>
              )}
              {lastSessionDetails.length > 0 ? (
                <div className="space-y-2">
                  {lastSessionDetails.map((detail, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-blue-800 flex-1">{detail}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-blue-600 bg-white rounded-lg px-3 py-2 border border-blue-100">No data</div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1">Today's Progress</div>
              <div className="text-xl font-bold text-purple-600">
                {currentProgressDetails.length > 0 ? `${currentProgressDetails.length} sets logged` : 'Not started'}
              </div>
            </div>
          </div>

          {currentProgressDetails.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold text-green-800">Today's Session</h4>
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  {currentProgressDetails.length} set{currentProgressDetails.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="space-y-3">
                {currentProgressDetails.map((detail, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-green-600">{index + 1}</span>
                    </div>
                    <span className="text-base font-medium text-green-800 flex-1">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              size="lg" 
              variant="primary-gradient"
              className="flex-1 text-lg py-4"
              onClick={() => setLogTarget({ exercise, currentLog: currentLog ?? null })}
            >
              <Dumbbell className="w-5 h-5 mr-2" />
              Log
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Today's Workout</h1>
        </div>
        <p className="text-xl text-gray-600">{formatDayLabel(new Date(today))}</p>
        <AddModal
          exercises={exercises}
          routines={routines}
          onAddExercise={onAddExercise}
          onAddRoutine={onAddRoutine}
        />
      </div>

      {/* Workout Plan */}
      <div className="space-y-6">
        {todayPlan.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <Dumbbell className="w-16 h-16 text-gray-400 mx-auto" />
              <h3 className="text-2xl font-semibold text-gray-700">No workout planned for today</h3>
              <p className="text-lg text-gray-500">Add some exercises or routines to get started!</p>
            </div>
          </Card>
        ) : (
          todayPlan.map((item, idx) => {
            if (item.type === 'exercise') {
              const exercise = exerciseById[item.id]
              if (!exercise) return null
              
              return renderExerciseCard(exercise)
            } else {
              // Routine group
              return (
                <div key={idx} className="space-y-4">
                  {/* Routine Header */}
                  <Card className="p-6 border-l-4" style={{ borderLeftColor: item.color }}>
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                      <Badge variant="outline" className="text-sm">
                        {item.exerciseIds.length} exercises
                      </Badge>
                    </div>
                  </Card>

                  {/* Routine Exercises */}
                  <div className="space-y-4 ml-8">
                    {item.exerciseIds.map((exerciseId) => {
                      const exercise = exerciseById[exerciseId]
                      if (!exercise) return null
                      
                      return renderExerciseCard(exercise)
                    })}
                  </div>
                </div>
              )
            }
          })
        )}
      </div>

      {/* Log Dialog Modal */}
      <LogDialog
        open={!!logTarget}
        onOpenChange={() => setLogTarget(null)}
        exercise={logTarget?.exercise || null}
        settings={settings}
        day={todayDayKey}
        dateISO={today}
        existingLog={logTarget?.currentLog ?? null}
        onSave={(payload) => {
          if (!logTarget) return
          
          if (logTarget.currentLog) {
            // Update existing log
            dispatch(actions.logs.update(logTarget.currentLog.id, payload))
          } else {
            // Create new log
            const entry: LogEntry = { 
              id: uid(), 
              day: todayDayKey, 
              exerciseId: logTarget.exercise.id, 
              dateISO: today, 
              payload 
            }
            dispatch(actions.logs.save(entry))
          }
          setLogTarget(null)
        }}
      />
    </div>
  )
}
