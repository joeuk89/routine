import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { History, Calendar } from 'lucide-react'
import type { Exercise } from '@/features/exercises/model/types'
import type { LogEntry } from '@/features/logs/model/log'
import type { MassUnit } from '@/lib/units'
import { MetricsService } from '@/lib/services/MetricsService'
import { formatDayLabel, startOfWeekMonday, startOfWeek, iso } from '@/lib/date'
import type { DayKey } from '@/lib/date'

function formatDateForModal(date: Date): string {
  const day = date.getDate()
  const month = date.toLocaleString('default', { month: 'long' })
  const year = date.getFullYear()
  
  const dayWithSuffix = day + (day % 10 === 1 && day !== 11 ? 'st' :
                              day % 10 === 2 && day !== 12 ? 'nd' :
                              day % 10 === 3 && day !== 13 ? 'rd' : 'th')
  
  return `${dayWithSuffix} ${month}, ${year}`
}

interface LastSessionPopoverProps {
  exercise: Exercise
  lastLog: LogEntry | undefined
  unit: MassUnit
  currentWeekStartISO: string
  weekStartDay: DayKey
  onGoToWeek: (dateISO: string) => void
}

export function LastSessionPopover({ exercise, lastLog, unit, currentWeekStartISO, weekStartDay, onGoToWeek }: LastSessionPopoverProps) {
  const lastSessionDetails = MetricsService.getCurrentProgressDetails(exercise, lastLog, unit)
  
  if (!lastLog || lastSessionDetails.length === 0) {
    return <span className="inline-flex items-center"><History className="w-3 h-3 mr-1"/>Last session: —</span>
  }

  const sessionDate = new Date(lastLog.dateISO + 'T00:00:00Z')
  
  // Check if the last session is in the current week (using custom week start)
  const lastSessionWeekStart = iso(startOfWeek(sessionDate, weekStartDay))
  const isInCurrentWeek = lastSessionWeekStart === currentWeekStartISO

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center hover:text-blue-600 transition-colors cursor-pointer text-xs">
          <History className="w-3 h-3 mr-1"/>Last session: {formatDayLabel(sessionDate)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-white border shadow-md" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">{exercise.name}</h4>
            <span className="text-sm text-muted-foreground">{formatDateForModal(sessionDate)}</span>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Session Details:</div>
            <div className="space-y-1">
              {lastSessionDetails.map((detail, idx) => (
                <div key={idx} className="text-sm bg-gray-50 px-3 py-2 rounded text-gray-800">
                  {detail}
                </div>
              ))}
            </div>
          </div>

          {!isInCurrentWeek && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onGoToWeek(lastLog.dateISO)}
              className="w-full"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Go to this week
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
