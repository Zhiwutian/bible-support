import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts';
import {
  loadPreferredTranslation,
  PREFERRED_TRANSLATION_STORAGE_KEY,
  savePreferredTranslation,
} from '@/lib/preferred-translation';

type PreferredTranslationContextValue = {
  /** Value in localStorage, or null if the user has not set a global preference yet. */
  preferredTranslation: ScriptureTranslationCode | null;
  /** `preferredTranslation` or KJV when a concrete code is required. */
  effectivePreferredTranslation: ScriptureTranslationCode;
  setPreferredTranslation: (translation: ScriptureTranslationCode) => void;
};

const PreferredTranslationContext =
  createContext<PreferredTranslationContextValue | null>(null);

type Props = { children: ReactNode };

export function PreferredTranslationProvider({ children }: Props) {
  const [preferredTranslation, setPreferredState] =
    useState<ScriptureTranslationCode | null>(() => loadPreferredTranslation());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== PREFERRED_TRANSLATION_STORAGE_KEY) return;
      setPreferredState(loadPreferredTranslation());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPreferredTranslation = useCallback(
    (translation: ScriptureTranslationCode) => {
      savePreferredTranslation(translation);
      setPreferredState(translation);
    },
    [],
  );

  const value = useMemo<PreferredTranslationContextValue>(
    () => ({
      preferredTranslation,
      effectivePreferredTranslation: preferredTranslation ?? 'KJV',
      setPreferredTranslation,
    }),
    [preferredTranslation, setPreferredTranslation],
  );

  return (
    <PreferredTranslationContext.Provider value={value}>
      {children}
    </PreferredTranslationContext.Provider>
  );
}

/** Colocated with provider; Fast Refresh expects hooks in a separate module. */
/* eslint-disable react-refresh/only-export-components -- hook must live next to private context */
export function usePreferredTranslation(): PreferredTranslationContextValue {
  const ctx = useContext(PreferredTranslationContext);
  if (!ctx) {
    throw new Error(
      'usePreferredTranslation must be used within PreferredTranslationProvider',
    );
  }
  return ctx;
}
