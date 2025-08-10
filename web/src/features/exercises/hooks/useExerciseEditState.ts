import { useState, useCallback } from 'react'
import type { Exercise } from '../model/types'

export function useExerciseEditState() {
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const openEdit = useCallback((exercise: Exercise) => {
    setEditingExercise(exercise)
    setIsEditModalOpen(true)
  }, [])

  const closeEdit = useCallback(() => {
    setEditingExercise(null)
    setIsEditModalOpen(false)
  }, [])

  const saveEdit = useCallback((
    updatedExercise: Exercise,
    onSave: (exercise: Exercise) => void
  ) => {
    onSave(updatedExercise)
    closeEdit()
  }, [closeEdit])

  return {
    editingExercise,
    isEditModalOpen,
    openEdit,
    closeEdit,
    saveEdit
  }
}
