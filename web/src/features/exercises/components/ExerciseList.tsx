import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, LinkIcon, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { Exercise } from '../model/types'
import type { ProgressionType, WeightUnit } from '@/lib/units'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function ExerciseList({ exercises, onRemove, onEdit }: { exercises: Exercise[]; onRemove: (id: string) => void; onEdit: (e: Exercise) => void }) {
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [form, setForm] = useState<Exercise | null>(null)

  // Sort exercises alphabetically
  const sortedExercises = useMemo(() => {
    return exercises.sort((a, b) => a.name.localeCompare(b.name))
  }, [exercises])

  function openEdit(e: Exercise) {
    setEditing(e)
    setForm({ ...e })
  }
  function save() {
    if (!form) return
    onEdit(form)
    setEditing(null)
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            <h2 className="font-semibold">Your Exercises</h2>
          </div>
        </div>
        
        {exercises.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No exercises yet. Add some above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedExercises.map((exercise) => (
              <div 
                key={exercise.id} 
                className="group p-4 hover:bg-gray-50/50 transition-colors duration-150"
              >
                <div className="flex items-center justify-between">
                  {/* Left side: Color indicator, name, and details */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: exercise.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">{exercise.name}</h4>
                        <Badge 
                          variant="secondary" 
                          className="text-xs font-normal shrink-0"
                          style={{ 
                            backgroundColor: `${exercise.color}08`,
                            color: exercise.color,
                            border: `1px solid ${exercise.color}15`
                          }}
                        >
                          {exercise.type.replace('_', ' ').toLowerCase()}
                        </Badge>
                      </div>
                      
                      {/* Additional details */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {exercise.weightUnit && exercise.weightUnit !== 'DEFAULT' && (
                          <span>{exercise.weightUnit}</span>
                        )}
                        {exercise.refUrl && (
                          <a 
                            href={exercise.refUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Reference
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Actions */}
                  <div className="flex gap-1 ml-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEdit(exercise)}
                      className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onRemove(exercise.id)}
                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Exercise</DialogTitle>
            </DialogHeader>
            {form && (
              <div className="grid gap-3">
                <Input value={form.name} onChange={(e) => setForm({ ...(form as Exercise), name: e.target.value })} />
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...(form as Exercise), color: e.target.value })} />
                  <Input value={form.color} onChange={(e) => setForm({ ...(form as Exercise), color: e.target.value })} />
                </div>
                <Select value={form.type} onValueChange={(v: ProgressionType) => setForm({ ...(form as Exercise), type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEIGHT_REPS">Weight + Reps</SelectItem>
                    <SelectItem value="HOLD_SECONDS">Hold (seconds)</SelectItem>
                    <SelectItem value="REPS_ONLY">Reps only</SelectItem>
                    <SelectItem value="DISTANCE_TIME">Distance + Time</SelectItem>
                  </SelectContent>
                </Select>
                {form.type === 'WEIGHT_REPS' && (
                  <Select value={form.weightUnit || 'DEFAULT'} onValueChange={(v: WeightUnit) => setForm({ ...(form as Exercise), weightUnit: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEFAULT">Use App Default</SelectItem>
                      <SelectItem value="KG">Kilograms (kg)</SelectItem>
                      <SelectItem value="LBS">Pounds (lbs)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Input value={form.refUrl || ''} onChange={(e) => setForm({ ...(form as Exercise), refUrl: e.target.value })} placeholder="Reference URL" />
              </div>
            )}
            <DialogFooter>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}


