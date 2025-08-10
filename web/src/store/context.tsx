import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { reducer } from './reducer'
import { defaultState, type AppState } from './state'
import type { Actions } from './actions'
import { LocalStorageAdapter } from '@/services/storage/localStorage'

type Store = {
  state: AppState
  dispatch: React.Dispatch<Actions>
}

const StoreContext = createContext<Store | undefined>(undefined)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState)
  const value = useMemo(() => ({ state, dispatch }), [state])
  const hasLoadedRef = useRef(false)
  
  // Load on mount
  useEffect(() => {
    ;(async () => {
      const loaded = await LocalStorageAdapter.load()
      dispatch({ type: 'LOAD_FROM_STORAGE', payload: loaded })
      hasLoadedRef.current = true
    })()
  }, [])
  
  // Persist on change (but not during initial load)
  useEffect(() => {
    if (hasLoadedRef.current) {
      LocalStorageAdapter.save(state)
    }
  }, [state])
  
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}


