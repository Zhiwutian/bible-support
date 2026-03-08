import { ReactNode, useReducer } from 'react';
import {
  AppDispatchContext,
  AppStateContext,
  appStateReducer,
  initialState,
} from './app-state-store';

type Props = {
  children: ReactNode;
};

/**
 * Provide app-level UI state via Context + reducer.
 */
export function AppStateProvider({ children }: Props) {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
