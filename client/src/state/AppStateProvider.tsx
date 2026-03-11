import { ReactNode, useEffect, useMemo, useReducer } from 'react';
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
  const hydratedInitialState = useMemo(() => {
    if (typeof window === 'undefined') return initialState;
    const persistedTextScale = window.localStorage.getItem('text-scale');
    const persistedHighContrast = window.localStorage.getItem('high-contrast');
    return {
      ...initialState,
      textScale:
        persistedTextScale === 'sm' ||
        persistedTextScale === 'md' ||
        persistedTextScale === 'lg' ||
        persistedTextScale === 'xl'
          ? persistedTextScale
          : // Backward compatibility for previous "Huge" option.
            persistedTextScale === 'xxl'
            ? 'xl'
            : initialState.textScale,
      highContrast: persistedHighContrast === 'true',
    };
  }, []);
  const [state, dispatch] = useReducer(appStateReducer, hydratedInitialState);

  useEffect(() => {
    window.localStorage.setItem('text-scale', state.textScale);
    window.localStorage.setItem('high-contrast', String(state.highContrast));
  }, [state.textScale, state.highContrast]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
