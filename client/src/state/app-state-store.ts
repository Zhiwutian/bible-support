import { createContext, Dispatch } from 'react';

export type TodoFilter = 'all' | 'active' | 'completed';

export type AppState = {
  todoFilter: TodoFilter;
};

export type AppAction = {
  type: 'todoFilter/set';
  payload: TodoFilter;
};

export const initialState: AppState = {
  todoFilter: 'all',
};

/**
 * Reducer for frontend app-level UI state.
 */
export function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'todoFilter/set':
      return { ...state, todoFilter: action.payload };
    default:
      return state;
  }
}

export const AppStateContext = createContext<AppState | null>(null);
export const AppDispatchContext = createContext<Dispatch<AppAction> | null>(
  null,
);
