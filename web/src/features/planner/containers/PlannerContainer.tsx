import { useStore } from '@/store/context'
import { usePlannerData } from '../hooks/usePlannerData'
import { usePlannerActions } from '../hooks/usePlannerActions'
import { PlannerPresenter } from '../components/PlannerPresenter'
import type { DayKey } from '@/lib/date'

export interface PlannerContainerProps {
  onLog: (dateISO: string, day: DayKey, exerciseId: string) => void
}

export function PlannerContainer({ onLog }: PlannerContainerProps) {
  const { state, dispatch } = useStore()
  const plannerData = usePlannerData(state)
  const plannerActions = usePlannerActions(
    dispatch, 
    onLog, 
    plannerData.weekStartISO,
    plannerData.settings.weekStartDay || 'Monday'
  )
  
  return (
    <PlannerPresenter 
      data={plannerData}
      actions={plannerActions}
    />
  )
}
