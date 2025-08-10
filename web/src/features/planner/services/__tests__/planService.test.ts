/**
 * Basic unit tests for PlanService
 * These tests validate that the complex logic extracted from the reducer works correctly.
 * 
 * Note: This is a minimal test setup for validation purposes.
 * Full testing infrastructure will be added in Phase 4 (Task 13).
 */

import { PlanService } from '../planService'
import type { Plan, PlanItem } from '../../model/plan'

// Test data
const samplePlan: Plan = {
  '2024-01-01': [
    { type: 'exercise', id: 'exercise1' },
    { type: 'routine', name: 'Morning Routine', color: '#ff0000', exerciseIds: ['exercise1', 'exercise2'] },
    { type: 'exercise', id: 'exercise3' }
  ],
  '2024-01-02': [
    { type: 'exercise', id: 'exercise1' },
    { type: 'routine', name: 'Evening Routine', color: '#00ff00', exerciseIds: ['exercise1', 'exercise4'] }
  ],
  '2024-01-03': [
    { type: 'routine', name: 'Morning Routine', color: '#ff0000', exerciseIds: ['exercise2'] }
  ]
}

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

// Test removeExerciseFromPlan
function testRemoveExerciseFromPlan() {
  console.log('Testing removeExerciseFromPlan...')
  
  // Test removing exercise1 (used in both exercises and routines)
  const result = PlanService.removeExerciseFromPlan(samplePlan, 'exercise1')
  
  // Should remove direct exercise references
  assert(!result['2024-01-01']?.some(item => item.type === 'exercise' && item.id === 'exercise1'), 
    'Direct exercise1 references should be removed')
  assert(!result['2024-01-02']?.some(item => item.type === 'exercise' && item.id === 'exercise1'), 
    'Direct exercise1 references should be removed from all dates')
  
  // Should remove exercise1 from routine exerciseIds
  const morningRoutine = result['2024-01-01']?.find(item => 
    item.type === 'routine' && item.name === 'Morning Routine'
  ) as { type: 'routine'; name: string; color: string; exerciseIds: string[] }
  
  assert(morningRoutine !== undefined, 'Morning routine should still exist')
  assert(!morningRoutine.exerciseIds.includes('exercise1'), 'exercise1 should be removed from routine')
  assert(morningRoutine.exerciseIds.includes('exercise2'), 'exercise2 should remain in routine')
  
  // Should remove routine completely if no exercises remain
  const eveningRoutine = result['2024-01-02']?.find(item => 
    item.type === 'routine' && item.name === 'Evening Routine'
  )
  assert(eveningRoutine !== undefined, 'Evening routine should exist (has exercise4)')
  
  // Should remove date completely if no items remain after removing routine
  const result2 = PlanService.removeExerciseFromPlan(samplePlan, 'exercise2')
  assert(result2['2024-01-03'] === undefined, 'Date should be removed when no items remain')
  
  console.log('✓ removeExerciseFromPlan tests passed')
}

// Test setPlanItemsForDate
function testSetPlanItemsForDate() {
  console.log('Testing setPlanItemsForDate...')
  
  const newItems: PlanItem[] = [
    { type: 'exercise', id: 'newExercise' }
  ]
  
  // Test setting items for existing date
  const result1 = PlanService.setPlanItemsForDate(samplePlan, '2024-01-01', newItems)
  assertEqual(result1['2024-01-01'], newItems, 'Should replace existing items')
  assert(result1['2024-01-02'] === samplePlan['2024-01-02'], 'Should preserve other dates')
  
  // Test setting items for new date
  const result2 = PlanService.setPlanItemsForDate(samplePlan, '2024-01-04', newItems)
  assertEqual(result2['2024-01-04'], newItems, 'Should add new date')
  assert(result2['2024-01-01'] === samplePlan['2024-01-01'], 'Should preserve existing dates')
  
  // Test setting empty items (should remove date)
  const result3 = PlanService.setPlanItemsForDate(samplePlan, '2024-01-01', [])
  assert(result3['2024-01-01'] === undefined, 'Should remove date when setting empty items')
  
  console.log('✓ setPlanItemsForDate tests passed')
}

// Test addItemToPlan
function testAddItemToPlan() {
  console.log('Testing addItemToPlan...')
  
  const newItem: PlanItem = { type: 'exercise', id: 'newExercise' }
  
  // Test adding to existing date
  const result1 = PlanService.addItemToPlan(samplePlan, '2024-01-01', newItem)
  assert(result1['2024-01-01'].length === samplePlan['2024-01-01'].length + 1, 'Should add to existing items')
  assert(result1['2024-01-01'].includes(newItem), 'Should include the new item')
  
  // Test adding to new date
  const result2 = PlanService.addItemToPlan(samplePlan, '2024-01-04', newItem)
  assertEqual(result2['2024-01-04'], [newItem], 'Should create new date with item')
  
  console.log('✓ addItemToPlan tests passed')
}

// Test utility functions
function testUtilityFunctions() {
  console.log('Testing utility functions...')
  
  // Test getPlanItemsForDate
  const items = PlanService.getPlanItemsForDate(samplePlan, '2024-01-01')
  assertEqual(items, samplePlan['2024-01-01'], 'Should return correct items')
  assertEqual(PlanService.getPlanItemsForDate(samplePlan, '2024-01-99'), [], 'Should return empty array for non-existent date')
  
  // Test isEmpty
  assert(!PlanService.isEmpty(samplePlan), 'Sample plan should not be empty')
  assert(PlanService.isEmpty({}), 'Empty plan should be empty')
  
  // Test getActiveDates
  const activeDates = PlanService.getActiveDates(samplePlan)
  assertEqual(activeDates.sort(), ['2024-01-01', '2024-01-02', '2024-01-03'], 'Should return sorted active dates')
  
  // Test getTotalItemCount
  const totalItems = PlanService.getTotalItemCount(samplePlan)
  assert(totalItems === 6, `Expected 6 total items, got ${totalItems}`)
  
  console.log('✓ Utility function tests passed')
}

// Run all tests
function runTests() {
  console.log('Running PlanService tests...\n')
  
  try {
    testRemoveExerciseFromPlan()
    testSetPlanItemsForDate()
    testAddItemToPlan()
    testUtilityFunctions()
    
    console.log('\n✅ All PlanService tests passed!')
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
