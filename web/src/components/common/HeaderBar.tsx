import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Database, Download, Trash2, Upload } from 'lucide-react'
import { LocalStorageAdapter } from '@/services/storage/localStorage'
import { toast } from 'sonner'
import type { AppState } from '@/store/state'

export function HeaderBar({ state, onReset, onDrive, onImport }: { state: AppState; onReset: () => void; onDrive: () => void; onImport: (s: AppState) => void }) {
  async function exportJson() {
    const blob = await LocalStorageAdapter.export(state)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workout-planner-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJson(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const parsed = await LocalStorageAdapter.import(String(reader.result))
        onImport(parsed)
        toast.success('Imported data')
      } catch {
        toast.error('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    ev.target.value = ''
  }

  return (
    <div className="flex flex-wrap items-center gap-2 justify-between mb-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Workout Planner</h1>
        <Badge className="ml-2">MVP</Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={exportJson}>
          <Download className="w-4 h-4 mr-2" /> Export JSON
        </Button>
        <label className="inline-flex items-center">
          <input type="file" accept="application/json" className="hidden" onChange={importJson} />
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" /> Import
          </Button>
        </label>
        <Button variant="outline" onClick={onDrive}>
          <Database className="w-4 h-4 mr-2" /> Google Drive (beta)
        </Button>
        <Button variant="outline" onClick={onReset} className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400">
          <Trash2 className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  )
}


