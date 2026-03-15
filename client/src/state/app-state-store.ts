import { createContext, Dispatch } from 'react';
export type TextScale = 'sm' | 'md' | 'lg' | 'xl';

export type AppState = {
  textScale: TextScale;
  highContrast: boolean;
  darkMode: boolean;
};

export type AppAction =
  | {
      type: 'textScale/set';
      payload: TextScale;
    }
  | {
      type: 'highContrast/set';
      payload: boolean;
    }
  | {
      type: 'darkMode/set';
      payload: boolean;
    };

export const initialState: AppState = {
  textScale: 'sm',
  highContrast: false,
  darkMode: false,
};

/**
 * Reducer for frontend app-level UI state.
 */
export function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'textScale/set':
      return { ...state, textScale: action.payload };
    case 'highContrast/set':
      return { ...state, highContrast: action.payload };
    case 'darkMode/set':
      return { ...state, darkMode: action.payload };
    default:
      return state;
  }
}

export const AppStateContext = createContext<AppState | null>(null);
export const AppDispatchContext = createContext<Dispatch<AppAction> | null>(
  null,
);
