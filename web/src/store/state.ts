import type { Exercise } from '@/features/exercises/model/types'
import type { Plan } from '@/features/planner/model/plan'
import type { LogEntry } from '@/features/logs/model/log'
import type { AppSettings } from '@/features/settings/model/settings'
import type { Routine } from '@/features/routines/model/types'
import { iso, startOfWeek } from '@/lib/date'

export type AppState = {
  exercises: Exercise[]
  routines: Routine[]
  plan: Plan // Single date-based plan for all dates
  logs: LogEntry[]
  settings: AppSettings
  currentWeekStartISO: string
}

export const defaultState: AppState = (() => {
  const today = new Date()
  const currentWeekStart = startOfWeek(today, 'Monday') // Default to Monday start
  const currentWeekStartISO = iso(currentWeekStart)
  return {
    exercises: [],
    routines: [],
    plan: {}, // Empty date-based plan
    logs: [],
    settings: { defaultUnit: 'KG', weekStartDay: 'Monday' },
    currentWeekStartISO,
  }
})()


