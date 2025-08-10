import type { Exercise } from '@/features/exercises/model/types'
import type { Routine } from '@/features/routines/model/types'
import type { DayKey } from '@/lib/date'

export type Actions =
  | { type: 'ADD_EXERCISE'; payload: Exercise }
  | { type: 'REMOVE_EXERCISE'; payload: { id: string } }
  | { type: 'EDIT_EXERCISE'; payload: Exercise }
  | { type: 'ADD_ROUTINE'; payload: Routine }
  | { type: 'REMOVE_ROUTINE'; payload: { id: string } }
  | { type: 'EDIT_ROUTINE'; payload: Routine }
  | { type: 'REORDER_ROUTINE_EXERCISES'; payload: { routineId: string; exerciseIds: string[] } }
  | { type: 'UPDATE_PLAN'; payload: { dateISO: string; items: import('@/features/planner/model/plan').PlanItem[] } }
  | { type: 'REORDER_PLAN_ITEMS'; payload: { dateISO: string; items: import('@/features/planner/model/plan').PlanItem[] } }
  | { type: 'SAVE_LOG'; payload: { entry: import('@/features/logs/model/log').LogEntry } }
  | { type: 'UPDATE_LOG'; payload: { id: string; payload: any } }
  | { type: 'SET_SETTINGS'; payload: Partial<import('@/features/settings/model/settings').AppSettings> }
  | { type: 'RECALCULATE_CURRENT_WEEK'; payload: {} }
  | { type: 'SET_CURRENT_WEEK'; payload: { weekStartISO: string } }
  | { type: 'REPLACE_ALL'; payload: import('./state').AppState }
  | { type: 'LOAD_FROM_STORAGE'; payload: import('./state').AppState }


