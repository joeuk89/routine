import type { DayKey } from '../date'
import { startOfWeek, iso, getDayOrder, addDaysUTC } from '../date'
import type { AppSettings } from '@/features/settings/model/settings'

/**
 * Service class for week-related calculations and operations.
 * Extracts week logic from reducers and provides reusable utilities.
 */
export class WeekService {
  /**
   * Recalculates the current week start date based on app settings.
   * Uses today's date and the configured week start day.
   */
  static recalculateCurrentWeek(settings: AppSettings): string {
    const today = new Date()
    const weekStartDay = settings.weekStartDay || 'Monday'
    const weekStart = startOfWeek(today, weekStartDay)
    return iso(weekStart)
  }

  /**
   * Gets an array of ISO date strings for a week starting from weekStartISO.
   */
  static getWeekDates(weekStartISO: string, weekStartDay: DayKey): string[] {
    const weekStart = new Date(weekStartISO + 'T00:00:00Z')
    const dates: string[] = []
    
    for (let i = 0; i < 7; i++) {
      const date = addDaysUTC(weekStart, i)
      dates.push(iso(date))
    }
    
    return dates
  }

  /**
   * Gets the week start date for a given date.
   */
  static getWeekForDate(dateISO: string, weekStartDay: DayKey): string {
    const date = new Date(dateISO + 'T00:00:00Z')
    const weekStart = startOfWeek(date, weekStartDay)
    return iso(weekStart)
  }

  /**
   * Navigates to the previous week.
   */
  static getPreviousWeek(currentWeekStartISO: string): string {
    const currentWeekStart = new Date(currentWeekStartISO + 'T00:00:00Z')
    const previousWeekStart = addDaysUTC(currentWeekStart, -7)
    return iso(previousWeekStart)
  }

  /**
   * Navigates to the next week.
   */
  static getNextWeek(currentWeekStartISO: string): string {
    const currentWeekStart = new Date(currentWeekStartISO + 'T00:00:00Z')
    const nextWeekStart = addDaysUTC(currentWeekStart, 7)
    return iso(nextWeekStart)
  }

  /**
   * Gets the week start date that contains a specific target date.
   */
  static getWeekContaining(targetDateISO: string, weekStartDay: DayKey): string {
    return this.getWeekForDate(targetDateISO, weekStartDay)
  }

  /**
   * Checks if a date is within a specific week.
   */
  static isDateInWeek(dateISO: string, weekStartISO: string, weekStartDay: DayKey): boolean {
    const weekDates = this.getWeekDates(weekStartISO, weekStartDay)
    return weekDates.includes(dateISO)
  }

  /**
   * Gets the day order for a week based on the start day.
   */
  static getDayOrder(weekStartDay: DayKey): DayKey[] {
    return getDayOrder(weekStartDay)
  }

  /**
   * Gets the ISO date for a specific day key within a week.
   */
  static getDateForDayInWeek(weekStartISO: string, dayKey: DayKey, weekStartDay: DayKey): string {
    const dayOrder = this.getDayOrder(weekStartDay)
    const dayIndex = dayOrder.indexOf(dayKey)
    
    if (dayIndex === -1) {
      throw new Error(`Invalid day key: ${dayKey}`)
    }
    
    const weekStart = new Date(weekStartISO + 'T00:00:00Z')
    const targetDate = addDaysUTC(weekStart, dayIndex)
    return iso(targetDate)
  }

  /**
   * Gets the current date as an ISO string.
   */
  static getCurrentDateISO(): string {
    return iso(new Date())
  }

  /**
   * Checks if the current week needs to be recalculated based on settings change.
   * Returns true if weekStartDay changed.
   */
  static shouldRecalculateWeek(
    newSettings: Partial<AppSettings>, 
    currentSettings: AppSettings
  ): boolean {
    return Boolean(
      newSettings.weekStartDay && 
      newSettings.weekStartDay !== currentSettings.weekStartDay
    )
  }
}
