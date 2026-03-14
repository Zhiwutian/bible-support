import { createContext, Dispatch } from 'react';

export type TodoFilter = 'all' | 'active' | 'completed';
export type TextScale = 'sm' | 'md' | 'lg' | 'xl';

export type AppState = {
  todoFilter: TodoFilter;
  textScale: TextScale;
  highContrast: boolean;
};

export type AppAction =
  | {
      type: 'todoFilter/set';
      payload: TodoFilter;
    }
  | {
      type: 'textScale/set';
      payload: TextScale;
    }
  | {
      type: 'highContrast/set';
      payload: boolean;
    };

export const initialState: AppState = {
  todoFilter: 'all',
  textScale: 'sm',
  highContrast: false,
};

/**
 * Reducer for frontend app-level UI state.
 */
export function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'todoFilter/set':
      return { ...state, todoFilter: action.payload };
    case 'textScale/set':
      return { ...state, textScale: action.payload };
    case 'highContrast/set':
      return { ...state, highContrast: action.payload };
    default:
      return state;
  }
}

export const AppStateContext = createContext<AppState | null>(null);
export const AppDispatchContext = createContext<Dispatch<AppAction> | null>(
  null,
);
