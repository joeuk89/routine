export type DayKey =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday'

export const dayOrder: DayKey[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export function startOfWeekMonday(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() // 0=Sun .. 6=Sat
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setUTCDate(date.getUTCDate() + diff)
  return monday
}

// Get the day index (0-6) for a given DayKey
export function getDayIndex(dayKey: DayKey): number {
  const dayMap: Record<DayKey, number> = {
    'Sunday': 0,
    'Monday': 1, 
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  }
  return dayMap[dayKey]
}

// Get the start of week for any given start day
export function startOfWeek(d: Date, weekStartDay: DayKey): Date {
  // Create a proper UTC date from the input
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const currentDay = date.getUTCDay() // 0=Sun .. 6=Sat
  const startDayIndex = getDayIndex(weekStartDay)
  
  // Calculate how many days to go back to reach the start of the week
  let diff = currentDay - startDayIndex
  if (diff < 0) {
    diff += 7 // If start day is later in the week, go back to previous week
  }
  
  // Create a new date and subtract the difference
  const result = new Date(date.getTime())
  result.setUTCDate(result.getUTCDate() - diff)
  
  // Validate the result
  if (isNaN(result.getTime())) {
    console.error('Invalid date created in startOfWeek:', {
      input: d,
      weekStartDay,
      currentDay,
      startDayIndex,
      diff,
      originalDate: date,
      result
    })
    // Fallback to Monday-based calculation
    return startOfWeekMonday(d)
  }
  
  return result
}

// Generate day order array starting from a specific day
export function getDayOrder(weekStartDay: DayKey): DayKey[] {
  const allDays: DayKey[] = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ]
  const startIndex = getDayIndex(weekStartDay)
  return [
    ...allDays.slice(startIndex),
    ...allDays.slice(0, startIndex)
  ]
}

// Get the ISO date for a logical day within a week
export function getDateForDayInWeek(weekStartISO: string, dayKey: DayKey, weekStartDay: DayKey): string {
  const weekStart = new Date(weekStartISO + 'T00:00:00Z')
  const dayOrder = getDayOrder(weekStartDay)
  const dayIndex = dayOrder.indexOf(dayKey)
  
  if (dayIndex === -1) {
    throw new Error(`Invalid day key: ${dayKey}`)
  }
  
  const targetDate = addDaysUTC(weekStart, dayIndex)
  return iso(targetDate)
}

// Get the logical day key for a given ISO date within a week
export function getDayKeyForDate(dateISO: string, weekStartDay: DayKey): DayKey {
  const date = new Date(dateISO + 'T00:00:00Z')
  const dayOfWeek = date.getUTCDay() // 0=Sun, 1=Mon, etc.
  
  // Map from UTC day index to DayKey
  const dayKeys: DayKey[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return dayKeys[dayOfWeek]
}

export function addDaysUTC(d: Date, days: number): Date {
  const nd = new Date(d)
  nd.setUTCDate(nd.getUTCDate() + days)
  return nd
}

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function formatDayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}


