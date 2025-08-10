import type { AppState } from '@/store/rootReducer'

export interface StorageAdapter {
  load(): Promise<AppState>
  save(state: AppState): Promise<void>
  export(state: AppState): Promise<Blob | string>
  import(payload: string | Blob): Promise<AppState>
}


