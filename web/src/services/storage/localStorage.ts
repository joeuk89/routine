import type { AppState } from '@/store/rootReducer'
import { defaultAppState } from '@/store/rootReducer'
import type { StorageAdapter } from './storage.types'

const LS_KEY = 'workout-planner-v3'

export const LocalStorageAdapter: StorageAdapter = {
  async load(): Promise<AppState> {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) return JSON.parse(raw) as AppState
      return defaultAppState
    } catch {
      return defaultAppState
    }
  },
  async save(state: AppState): Promise<void> {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  },
  async export(state: AppState): Promise<Blob> {
    return new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  },
  async import(payload: string | Blob): Promise<AppState> {
    if (typeof payload === 'string') return JSON.parse(payload) as AppState
    const text = await payload.text()
    return JSON.parse(text) as AppState
  },
}


