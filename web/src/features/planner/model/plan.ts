import type { DayKey } from '@/lib/date'

export type PlanItem = 
  | { type: 'exercise'; id: string }
  | { type: 'routine'; name: string; color: string; exerciseIds: string[] }

// New date-based plan structure - stores everything by ISO date
export type DateBasedPlan = Record<string, PlanItem[]> // key = dateISO (yyyy-mm-dd)

// Legacy day-based plan (for migration purposes)
export type LegacyPlan = Record<DayKey, PlanItem[]>

export const emptyLegacyPlan: LegacyPlan = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: [],
}

// Use date-based plan as the main type
export type Plan = DateBasedPlan

// Utility functions for working with date-based plans
export function getPlanItemsForDate(plan: Plan | undefined, dateISO: string): PlanItem[] {
  return plan?.[dateISO] || []
}

export function setPlanItemsForDate(plan: Plan | undefined, dateISO: string, items: PlanItem[]): Plan {
  return { ...plan, [dateISO]: items }
}

// Get plan items for a week of dates
export function getPlanForWeek(plan: Plan, weekDates: string[]): Record<string, PlanItem[]> {
  const weekPlan: Record<string, PlanItem[]> = {}
  weekDates.forEach(dateISO => {
    weekPlan[dateISO] = getPlanItemsForDate(plan, dateISO)
  })
  return weekPlan
}

// Migration function from legacy day-based to date-based
export function migrateLegacyPlanToDateBased(legacyPlan: LegacyPlan, weekStartISO: string, weekStartDay: DayKey): Plan {
  const plan: Plan = {}
  const weekStart = new Date(weekStartISO + 'T00:00:00Z')
  
  // Import day order and date utilities
  const { getDayOrder, addDaysUTC, iso } = require('@/lib/date')
  const dayOrder = getDayOrder(weekStartDay)
  
  dayOrder.forEach((dayKey, index) => {
    const items = legacyPlan[dayKey] || []
    if (items.length > 0) {
      const date = addDaysUTC(weekStart, index)
      const dateISO = iso(date)
      plan[dateISO] = items
    }
  })
  
  return plan
}


