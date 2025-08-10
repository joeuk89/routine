import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect } from 'react'
import { toast } from 'sonner'
import type { Exercise } from '../model/types'
import type { ProgressionType, WeightUnit } from '@/lib/units'
import { useExerciseForm } from '../hooks/useExerciseForm'

interface ExerciseFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (exercise: Exercise) => void
}

export function ExerciseFormModal({ open, onOpenChange, onAdd }: ExerciseFormModalProps) {
  const { formData, updateField, reset, submitWithToast } = useExerciseForm({
    color: '#3b82f6' // Different default color for modal
  })

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      reset({ color: '#3b82f6' })
    }
  }, [open, reset])

  function handleSubmit() {
    const success = submitWithToast((exercise) => {
      onAdd(exercise)
      onOpenChange(false)
      toast.success('Exercise created!')
    })
  }

  function handleCancel() {
    reset({ color: '#3b82f6' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Exercise</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input 
              value={formData.name} 
              onChange={(e) => updateField('name', e.target.value)} 
              placeholder="Bench Press" 
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2 mt-1">
              <input 
                type="color" 
                value={formData.color} 
                onChange={(e) => updateField('color', e.target.value)} 
                className="h-10 w-16 rounded border"
              />
              <Input 
                value={formData.color} 
                onChange={(e) => updateField('color', e.target.value)} 
                placeholder="#3b82f6"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={formData.type} onValueChange={(v: ProgressionType) => updateField('type', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEIGHT_REPS">Weight + Reps</SelectItem>
                <SelectItem value="HOLD_SECONDS">Hold (seconds)</SelectItem>
                <SelectItem value="REPS_ONLY">Reps only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'WEIGHT_REPS' && (
            <div>
              <label className="text-sm font-medium">Weight Unit</label>
              <Select value={formData.weightUnit} onValueChange={(v: WeightUnit) => updateField('weightUnit', v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFAULT">Use App Default</SelectItem>
                  <SelectItem value="KG">Kilograms (kg)</SelectItem>
                  <SelectItem value="LBS">Pounds (lbs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Reference URL (optional)</label>
            <Input 
              value={formData.refUrl} 
              onChange={(e) => updateField('refUrl', e.target.value)} 
              placeholder="https://example.com/how-to-bench-press" 
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmit}>
            Create Exercise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
