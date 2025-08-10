import type { AppSettings } from '../model/settings'

export interface SettingsState {
  preferences: AppSettings
  loading: boolean
  error: string | null
}

export const initialSettingsState: SettingsState = {
  preferences: {
    defaultUnit: 'KG',
    weekStartDay: 'Monday'
  },
  loading: false,
  error: null
}

export type SettingsAction =
  | { type: 'SETTINGS_UPDATE'; payload: { settings: Partial<AppSettings> } }
  | { type: 'SETTINGS_SET_LOADING'; payload: { loading: boolean } }
  | { type: 'SETTINGS_SET_ERROR'; payload: { error: string | null } }
  | { type: 'SETTINGS_LOAD'; payload: { settings: AppSettings } }

export function settingsReducer(
  state: SettingsState = initialSettingsState,
  action: SettingsAction
): SettingsState {
  switch (action.type) {
    case 'SETTINGS_UPDATE':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload.settings
        },
        error: null
      }
      
    case 'SETTINGS_LOAD':
      return {
        ...state,
        preferences: action.payload.settings,
        loading: false,
        error: null
      }
      
    case 'SETTINGS_SET_LOADING':
      return {
        ...state,
        loading: action.payload.loading
      }
      
    case 'SETTINGS_SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        loading: false
      }
      
    default:
      return state
  }
}
