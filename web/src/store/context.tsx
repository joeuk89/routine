import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { rootReducer, defaultAppState, type AppState, type AppActions } from './rootReducer'
import { LocalStorageAdapter } from '@/services/storage/localStorage'
import { createValidatedDispatch } from './middleware/validationMiddleware'
import { actions } from './actions'

type Store = {
  state: AppState
  dispatch: React.Dispatch<AppActions>
}

const StoreContext = createContext<Store | undefined>(undefined)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(rootReducer, defaultAppState)
  const dispatch = useMemo(() => createValidatedDispatch(rawDispatch), [rawDispatch])
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch])
  const hasLoadedRef = useRef(false)
  
  // Load on mount
  useEffect(() => {
    ;(async () => {
      const loaded = await LocalStorageAdapter.load()
      dispatch(actions.root.loadFromStorage(loaded))
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


