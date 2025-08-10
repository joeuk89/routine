import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form } from '@/components/form/Form'
import type { Exercise } from '../model/types'
import type { ProgressionType, WeightUnit } from '@/lib/units'
import { useExerciseForm } from '../hooks/useExerciseForm'
import type { FormComponentProps } from '@/lib/types/componentInterfaces'
import { validateFormComponentProps } from '@/lib/utils/propValidation'

/**
 * ExerciseForm allows users to create new exercises.
 * 
 * @param initialData - Initial data for the form (for editing, optional)
 * @param onSubmit - Called when form is submitted successfully
 * @param onCancel - Called when form is cancelled (optional)
 * @param submitLabel - Label for the submit button (default: "Add Exercise")
 * @param loading - Whether the form is in loading state (optional)
 * @param error - Error message to display if operation failed (optional)
 * @param className - Additional CSS classes (optional)
 * 
 * @example
 * ```tsx
 * <ExerciseForm
 *   onSubmit={handleAddExercise}
 *   submitLabel="Add Exercise"
 * />
 * ```
 */
interface ExerciseFormProps extends FormComponentProps<Exercise> {}

export function ExerciseForm({ 
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Add Exercise",
  loading = false,
  error = null,
  className 
}: ExerciseFormProps) {
  // Development-time prop validation
  validateFormComponentProps('ExerciseForm', { onSubmit, onCancel })
  
  const { formData, updateField, submitWithToast } = useExerciseForm(initialData)

  function handleSubmit() {
    submitWithToast(onSubmit)
  }

  return (
    <Card className={`shadow-sm ${className || ''}`}>
      <CardContent className="p-4">
        {/* Error state */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group columns={6}>
            <Form.Field label="Name" required>
              <Input 
                value={formData.name} 
                onChange={(e) => updateField('name', e.target.value)} 
                placeholder="Barbell squat" 
              />
            </Form.Field>

            <Form.Field label="Colour">
              <div className="flex gap-2">
                <input 
                  className="h-10 w-16 rounded border" 
                  type="color" 
                  value={formData.color} 
                  onChange={(e) => updateField('color', e.target.value)} 
                />
                <Input 
                  value={formData.color} 
                  onChange={(e) => updateField('color', e.target.value)} 
                />
              </div>
            </Form.Field>

            <Form.Field label="Progression Type">
              <Select value={formData.type} onValueChange={(v: ProgressionType) => updateField('type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEIGHT_REPS">Weight + Reps</SelectItem>
                  <SelectItem value="HOLD_SECONDS">Hold (seconds)</SelectItem>
                  <SelectItem value="REPS_ONLY">Reps only</SelectItem>
                  <SelectItem value="DISTANCE_TIME">Distance + Time</SelectItem>
                </SelectContent>
              </Select>
            </Form.Field>

            {formData.type === 'WEIGHT_REPS' && (
              <Form.Field label="Weight Unit">
                <Select value={formData.weightUnit} onValueChange={(v: WeightUnit) => updateField('weightUnit', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEFAULT">Use App Default</SelectItem>
                    <SelectItem value="KG">Kilograms (kg)</SelectItem>
                    <SelectItem value="LBS">Pounds (lbs)</SelectItem>
                  </SelectContent>
                </Select>
              </Form.Field>
            )}

            <Form.Field label="Reference URL" className="md:col-span-2">
              <Input 
                value={formData.refUrl} 
                onChange={(e) => updateField('refUrl', e.target.value)} 
                placeholder="https://youtu.be/..." 
              />
            </Form.Field>
          </Form.Group>

          <Form.Actions>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : submitLabel}
            </Button>
          </Form.Actions>
        </Form>
      </CardContent>
    </Card>
  )
}

// Development-only display name  
ExerciseForm.displayName = 'ExerciseForm'


