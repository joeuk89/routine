import { useMemo } from 'react'
import type { AppState } from '@/store/rootReducer'

export interface PlannerData {
  weekStartISO: string
  plan: Record<string, import('../model/plan').PlanItem[]>
  exercises: import('@/features/exercises/model/types').Exercise[]
  routines: import('@/features/routines/model/types').Routine[]
  logs: import('@/features/logs/model/log').LogEntry[]
  settings: import('@/features/settings/model/settings').AppSettings
}

export function usePlannerData(state: AppState): PlannerData {
  return useMemo(() => ({
    weekStartISO: state.planner.currentWeekStartISO,
    plan: state.planner.plan,
    exercises: state.exercises.allIds.map(id => state.exercises.byId[id]),
    routines: state.routines.allIds.map(id => state.routines.byId[id]).sort((a, b) => a.name.localeCompare(b.name)),
    logs: state.logs.allIds.map(id => state.logs.byId[id]),
    settings: state.settings.preferences
  }), [
    state.planner.currentWeekStartISO,
    state.planner.plan,
    state.exercises.byId,
    state.exercises.allIds,
    state.routines.byId,
    state.routines.allIds,
    state.logs.byId,
    state.logs.allIds,
    state.settings.preferences
  ])
}
