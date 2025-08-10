import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings as SettingsIcon } from 'lucide-react'
import type { AppSettings } from '../model/settings'
import type { DayKey } from '@/lib/date'

export function SettingsCard({ settings, onChange }: { settings: AppSettings; onChange: (s: AppSettings) => void }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 grid gap-3">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="w-5 h-5" />
          <h2 className="font-semibold">App Settings</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Default Weight Unit</label>
            <Select value={settings.defaultUnit} onValueChange={(v: any) => onChange({ ...settings, defaultUnit: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KG">Kilograms (kg)</SelectItem>
                <SelectItem value="LBS">Pounds (lbs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm">Week Start Day</label>
            <Select value={settings.weekStartDay} onValueChange={(v: DayKey) => onChange({ ...settings, weekStartDay: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sunday">Sunday</SelectItem>
                <SelectItem value="Monday">Monday</SelectItem>
                <SelectItem value="Tuesday">Tuesday</SelectItem>
                <SelectItem value="Wednesday">Wednesday</SelectItem>
                <SelectItem value="Thursday">Thursday</SelectItem>
                <SelectItem value="Friday">Friday</SelectItem>
                <SelectItem value="Saturday">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


