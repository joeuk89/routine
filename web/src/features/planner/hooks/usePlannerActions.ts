import { useMemo } from 'react'
import type { Dispatch } from 'react'
import { actions } from '@/store/actions'
import { addDaysUTC, iso, startOfWeek } from '@/lib/date'
import type { DayKey } from '@/lib/date'
import type { PlanItem } from '../model/plan'

export interface PlannerActions {
  onPlanUpdate: (dateISO: string, items: PlanItem[]) => void
  onLogExercise: (dateISO: string, day: DayKey, exerciseId: string) => void
  onWeekNavigate: (direction: 'prev' | 'next' | 'goto', dateISO?: string) => void
}

export function usePlannerActions(
  dispatch: Dispatch<any>,
  onLogCallback: (dateISO: string, day: DayKey, exerciseId: string) => void,
  currentWeekStartISO: string,
  weekStartDay: DayKey
): PlannerActions {
  return useMemo(() => ({
    onPlanUpdate: (dateISO: string, items: PlanItem[]) => {
      dispatch(actions.planner.updatePlan(dateISO, items))
    },
    
    onLogExercise: (dateISO: string, day: DayKey, exerciseId: string) => {
      onLogCallback(dateISO, day, exerciseId)
    },
    
    onWeekNavigate: (direction: 'prev' | 'next' | 'goto', dateISO?: string) => {
      const weekStart = new Date(currentWeekStartISO + 'T00:00:00Z')
      
      if (direction === 'prev') {
        const prev = addDaysUTC(weekStart, -7)
        const key = iso(prev)
        dispatch(actions.planner.setCurrentWeek(key))
      } else if (direction === 'next') {
        const next = addDaysUTC(weekStart, 7)
        const key = iso(next)
        dispatch(actions.planner.setCurrentWeek(key))
      } else if (direction === 'goto' && dateISO) {
        const date = new Date(dateISO + 'T00:00:00Z')
        const weekStart = startOfWeek(date, weekStartDay)
        const key = iso(weekStart)
        dispatch(actions.planner.setCurrentWeek(key))
      }
    }
  }), [dispatch, onLogCallback, currentWeekStartISO, weekStartDay])
}
