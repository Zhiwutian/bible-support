import { type Dispatch, useContext } from 'react';
import {
  AppDispatchContext,
  AppStateContext,
  type AppAction,
  type AppState,
} from './app-state-store';

/**
 * Read current app-level UI state.
 */
export function useAppState(): AppState {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

/**
 * Dispatch app-level UI state actions.
 */
export function useAppDispatch(): Dispatch<AppAction> {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within AppStateProvider');
  }
  return context;
}
