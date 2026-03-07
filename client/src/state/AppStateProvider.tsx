import { ReactNode, useMemo, useReducer } from 'react';
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
  const memoizedState = useMemo(() => state, [state]);

  return (
    <AppStateContext.Provider value={memoizedState}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
