import type { AppState } from '@/store/state'
import type { StorageAdapter } from './storage.types'

export const GoogleDriveAdapter: StorageAdapter = {
  async load(): Promise<AppState> {
    throw new Error('Google Drive adapter not implemented')
  },
  async save(): Promise<void> {
    throw new Error('Google Drive adapter not implemented')
  },
  async export(state: AppState): Promise<Blob> {
    return new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  },
  async import(payload: string | Blob): Promise<AppState> {
    const text = typeof payload === 'string' ? payload : await payload.text()
    return JSON.parse(text) as AppState
  },
}


