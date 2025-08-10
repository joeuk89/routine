/**
 * Basic unit tests for WeekService
 * These tests validate that the week calculation logic extracted from the reducer works correctly.
 * 
 * Note: This is a minimal test setup for validation purposes.
 * Full testing infrastructure will be added in Phase 4 (Task 13).
 */

import { WeekService } from '../weekService'
import type { DayKey } from '../../date'
import type { AppSettings } from '@/features/settings/model/settings'

// Simple test runner
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error('Expected:', expected)
    console.error('Actual:', actual)
    throw new Error(`Assertion failed: ${message}`)
  }
}

// Test getWeekDates
function testGetWeekDates() {
  console.log('Testing getWeekDates...')
  
  // Test Monday start
  const mondayWeek = WeekService.getWeekDates('2024-01-01', 'Monday') // 2024-01-01 is a Monday
  assertEqual(mondayWeek.length, 7, 'Should return 7 dates')
  assertEqual(mondayWeek[0], '2024-01-01', 'Should start with the given Monday')
  assertEqual(mondayWeek[6], '2024-01-07', 'Should end with Sunday')
  
  // Test Sunday start  
  const sundayWeek = WeekService.getWeekDates('2024-01-07', 'Sunday') // 2024-01-07 is a Sunday
  assertEqual(sundayWeek[0], '2024-01-07', 'Should start with the given Sunday')
  assertEqual(sundayWeek[6], '2024-01-13', 'Should end with Saturday')
  
  console.log('✓ getWeekDates tests passed')
}

// Test getPreviousWeek and getNextWeek
function testWeekNavigation() {
  console.log('Testing week navigation...')
  
  const currentWeek = '2024-01-01' // Monday
  
  // Test previous week
  const previousWeek = WeekService.getPreviousWeek(currentWeek)
  assertEqual(previousWeek, '2023-12-25', 'Should return previous Monday')
  
  // Test next week
  const nextWeek = WeekService.getNextWeek(currentWeek)
  assertEqual(nextWeek, '2024-01-08', 'Should return next Monday')
  
  // Test round trip
  const backToOriginal = WeekService.getPreviousWeek(nextWeek)
  assertEqual(backToOriginal, currentWeek, 'Should return to original week')
  
  console.log('✓ Week navigation tests passed')
}

// Test getWeekForDate
function testGetWeekForDate() {
  console.log('Testing getWeekForDate...')
  
  // Test Monday week start
  assertEqual(WeekService.getWeekForDate('2024-01-03', 'Monday'), '2024-01-01', 'Wednesday should belong to Monday week')
  assertEqual(WeekService.getWeekForDate('2024-01-07', 'Monday'), '2024-01-01', 'Sunday should belong to Monday week')
  assertEqual(WeekService.getWeekForDate('2024-01-08', 'Monday'), '2024-01-08', 'Next Monday should start new week')
  
  // Test Sunday week start
  assertEqual(WeekService.getWeekForDate('2024-01-03', 'Sunday'), '2023-12-31', 'Wednesday should belong to Sunday week starting Dec 31')
  assertEqual(WeekService.getWeekForDate('2024-01-06', 'Sunday'), '2023-12-31', 'Saturday should belong to Sunday week')
  assertEqual(WeekService.getWeekForDate('2024-01-07', 'Sunday'), '2024-01-07', 'Sunday should start new week')
  
  console.log('✓ getWeekForDate tests passed')
}

// Test recalculateCurrentWeek
function testRecalculateCurrentWeek() {
  console.log('Testing recalculateCurrentWeek...')
  
  // Mock current date to be predictable
  const originalDate = Date
  const mockDate = new Date('2024-01-03T12:00:00Z') // Wednesday
  
  // @ts-ignore - Mocking Date for testing
  global.Date = class extends Date {
    constructor() {
      super()
      return mockDate
    }
    static now() {
      return mockDate.getTime()
    }
  }
  
  try {
    const mondaySettings: AppSettings = { weekStartDay: 'Monday' }
    const mondayWeek = WeekService.recalculateCurrentWeek(mondaySettings)
    assertEqual(mondayWeek, '2024-01-01', 'Should return Monday of current week')
    
    const sundaySettings: AppSettings = { weekStartDay: 'Sunday' }
    const sundayWeek = WeekService.recalculateCurrentWeek(sundaySettings)
    assertEqual(sundayWeek, '2023-12-31', 'Should return Sunday of current week')
  } finally {
    // Restore original Date
    // @ts-ignore
    global.Date = originalDate
  }
  
  console.log('✓ recalculateCurrentWeek tests passed')
}

// Test shouldRecalculateWeek
function testShouldRecalculateWeek() {
  console.log('Testing shouldRecalculateWeek...')
  
  const currentSettings: AppSettings = { weekStartDay: 'Monday' }
  
  // Should recalculate when weekStartDay changes
  assert(WeekService.shouldRecalculateWeek({ weekStartDay: 'Sunday' }, currentSettings), 
    'Should recalculate when weekStartDay changes')
  
  // Should not recalculate when weekStartDay is same
  assert(!WeekService.shouldRecalculateWeek({ weekStartDay: 'Monday' }, currentSettings), 
    'Should not recalculate when weekStartDay is same')
  
  // Should not recalculate when weekStartDay is not provided
  assert(!WeekService.shouldRecalculateWeek({}, currentSettings), 
    'Should not recalculate when weekStartDay is not in new settings')
  
  console.log('✓ shouldRecalculateWeek tests passed')
}

// Test getDateForDayInWeek
function testGetDateForDayInWeek() {
  console.log('Testing getDateForDayInWeek...')
  
  const mondayWeekStart = '2024-01-01' // Monday
  
  // Test Monday week
  assertEqual(WeekService.getDateForDayInWeek(mondayWeekStart, 'Monday', 'Monday'), '2024-01-01', 'Monday should be first day')
  assertEqual(WeekService.getDateForDayInWeek(mondayWeekStart, 'Wednesday', 'Monday'), '2024-01-03', 'Wednesday should be third day')
  assertEqual(WeekService.getDateForDayInWeek(mondayWeekStart, 'Sunday', 'Monday'), '2024-01-07', 'Sunday should be last day')
  
  const sundayWeekStart = '2024-01-07' // Sunday
  
  // Test Sunday week
  assertEqual(WeekService.getDateForDayInWeek(sundayWeekStart, 'Sunday', 'Sunday'), '2024-01-07', 'Sunday should be first day')
  assertEqual(WeekService.getDateForDayInWeek(sundayWeekStart, 'Tuesday', 'Sunday'), '2024-01-09', 'Tuesday should be third day')
  assertEqual(WeekService.getDateForDayInWeek(sundayWeekStart, 'Saturday', 'Sunday'), '2024-01-13', 'Saturday should be last day')
  
  console.log('✓ getDateForDayInWeek tests passed')
}

// Test getDayOrder
function testGetDayOrder() {
  console.log('Testing getDayOrder...')
  
  const mondayOrder = WeekService.getDayOrder('Monday')
  assertEqual(mondayOrder[0], 'Monday', 'Monday should be first in Monday week')
  assertEqual(mondayOrder[6], 'Sunday', 'Sunday should be last in Monday week')
  
  const sundayOrder = WeekService.getDayOrder('Sunday')
  assertEqual(sundayOrder[0], 'Sunday', 'Sunday should be first in Sunday week')
  assertEqual(sundayOrder[6], 'Saturday', 'Saturday should be last in Sunday week')
  
  const wednesdayOrder = WeekService.getDayOrder('Wednesday')
  assertEqual(wednesdayOrder[0], 'Wednesday', 'Wednesday should be first in Wednesday week')
  assertEqual(wednesdayOrder[6], 'Tuesday', 'Tuesday should be last in Wednesday week')
  
  console.log('✓ getDayOrder tests passed')
}

// Run all tests
function runTests() {
  console.log('Running WeekService tests...\n')
  
  try {
    testGetWeekDates()
    testWeekNavigation()
    testGetWeekForDate()
    testRecalculateCurrentWeek()
    testShouldRecalculateWeek()
    testGetDateForDayInWeek()
    testGetDayOrder()
    
    console.log('\n✅ All WeekService tests passed!')
  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : String(error))
    // Exit with error if running in Node.js environment
    if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
      (globalThis as any).process.exit(1)
    }
  }
}

// Export for potential use in other test runners
export { runTests }

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests()
}
