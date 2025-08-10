import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Exercise } from '../model/types'
import type { ProgressionType, WeightUnit } from '@/lib/units'
import { uid } from '@/lib/id'

interface ExerciseFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (exercise: Exercise) => void
}

export function ExerciseFormModal({ open, onOpenChange, onAdd }: ExerciseFormModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [type, setType] = useState<ProgressionType>('WEIGHT_REPS')
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('DEFAULT')
  const [refUrl, setRefUrl] = useState('')

  function handleSubmit() {
    if (!name.trim()) {
      toast('Please enter an exercise name')
      return
    }

    const exercise: Exercise = {
      id: uid(),
      name: name.trim(),
      color,
      type,
      weightUnit: type === 'WEIGHT_REPS' ? weightUnit : undefined,
      refUrl: refUrl.trim() || undefined,
    }

    onAdd(exercise)
    
    // Reset form
    setName('')
    setColor('#3b82f6')
    setType('WEIGHT_REPS')
    setWeightUnit('DEFAULT')
    setRefUrl('')
    
    onOpenChange(false)
    toast.success('Exercise created!')
  }

  function handleCancel() {
    // Reset form
    setName('')
    setColor('#3b82f6')
    setType('WEIGHT_REPS')
    setWeightUnit('DEFAULT')
    setRefUrl('')
    
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
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Bench Press" 
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2 mt-1">
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                className="h-10 w-16 rounded border"
              />
              <Input 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                placeholder="#3b82f6"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={type} onValueChange={(v: ProgressionType) => setType(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEIGHT_REPS">Weight + Reps</SelectItem>
                <SelectItem value="HOLD_SECONDS">Hold (seconds)</SelectItem>
                <SelectItem value="REPS_ONLY">Reps only</SelectItem>
                <SelectItem value="DISTANCE_TIME">Distance + Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'WEIGHT_REPS' && (
            <div>
              <label className="text-sm font-medium">Weight Unit</label>
              <Select value={weightUnit} onValueChange={(v: WeightUnit) => setWeightUnit(v)}>
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
              value={refUrl} 
              onChange={(e) => setRefUrl(e.target.value)} 
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
