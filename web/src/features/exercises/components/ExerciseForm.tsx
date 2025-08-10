import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Exercise } from '../model/types'
import type { ProgressionType, WeightUnit } from '@/lib/units'
import { uid } from '@/lib/id'

export function ExerciseForm({ onAdd }: { onAdd: (e: Exercise) => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#22c55e')
  const [type, setType] = useState<ProgressionType>('WEIGHT_REPS')
  const [refUrl, setRefUrl] = useState('')
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('DEFAULT')

  function submit() {
    if (!name.trim()) return toast('Give the exercise a name.')
    onAdd({ id: uid(), name: name.trim(), color, type, refUrl: refUrl || undefined, weightUnit: type === 'WEIGHT_REPS' ? weightUnit : undefined })
    setName('')
    setRefUrl('')
    setWeightUnit('DEFAULT')
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 grid md:grid-cols-6 gap-3">
        <div>
          <label className="text-sm">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Barbell squat" />
        </div>
        <div>
          <label className="text-sm">Colour</label>
          <div className="flex gap-2">
            <input className="h-10 w-16 rounded" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            <Input value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm">Progression Type</label>
          <Select value={type} onValueChange={(v: any) => setType(v)}>
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
        </div>
        {type === 'WEIGHT_REPS' && (
          <div>
            <label className="text-sm">Weight Unit</label>
            <Select value={weightUnit} onValueChange={(v: any) => setWeightUnit(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFAULT">Use App Default</SelectItem>
                <SelectItem value="KG">Kilograms (kg)</SelectItem>
                <SelectItem value="LBS">Pounds (lbs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="md:col-span-2">
          <label className="text-sm">Reference URL</label>
          <Input value={refUrl} onChange={(e) => setRefUrl(e.target.value)} placeholder="https://youtu.be/..." />
        </div>
        <div className="md:col-span-6 flex justify-end">
          <Button onClick={submit}>Add Exercise</Button>
        </div>
      </CardContent>
    </Card>
  )
}


