import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { ExerciseService } from '../services/ExerciseService'
import type { Exercise } from '../model/types'
import type { ProgressionType, WeightUnit } from '@/lib/units'

export interface ExerciseFormData {
  name: string
  color: string
  type: ProgressionType
  weightUnit: WeightUnit
  refUrl: string
}

const defaultFormData: ExerciseFormData = {
  name: '',
  color: '#22c55e',
  type: 'WEIGHT_REPS',
  weightUnit: 'DEFAULT',
  refUrl: ''
}

export function useExerciseForm(initialData?: Partial<ExerciseFormData>) {
  const [formData, setFormData] = useState<ExerciseFormData>(() => ({
    ...defaultFormData,
    ...initialData
  }))

  const updateField = useCallback(<K extends keyof ExerciseFormData>(
    field: K, 
    value: ExerciseFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const reset = useCallback((newData?: Partial<ExerciseFormData>) => {
    setFormData({
      ...defaultFormData,
      ...newData
    })
  }, [])

  const validate = useCallback(() => {
    const validation = ExerciseService.validate(formData)
    return {
      isValid: validation.success,
      errors: validation.errors || {}
    }
  }, [formData])

  const toExercise = useCallback((): Exercise => {
    return ExerciseService.create(formData)
  }, [formData])

  const submitWithToast = useCallback((onSubmit: (exercise: Exercise) => void) => {
    const validation = validate()
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      toast.error(firstError || 'Please fix form errors')
      return false
    }

    try {
      const exercise = toExercise()
      onSubmit(exercise)
      reset()
      return true
    } catch (error) {
      toast.error('Failed to create exercise')
      return false
    }
  }, [validate, toExercise, reset])

  return {
    formData,
    updateField,
    reset,
    validate,
    toExercise,
    submitWithToast
  }
}
