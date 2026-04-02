import { useEffect, useState } from 'react';
import {
  READER_PREFERENCES_CHANGED_EVENT,
  READER_PREFERENCES_STORAGE_KEY,
  loadReaderPreferences,
  type ReaderPreferences,
} from '@/features/reader/reader-preferences';

/**
 * Reader preferences from localStorage, updating when the user changes options
 * on `/reader` (same tab) or in another tab (storage event).
 */
export function useReaderPreferencesLive(): ReaderPreferences {
  const [preferences, setPreferences] = useState(loadReaderPreferences);

  useEffect(() => {
    function refresh() {
      setPreferences(loadReaderPreferences());
    }
    function onStorage(event: StorageEvent) {
      if (event.key === READER_PREFERENCES_STORAGE_KEY || event.key === null) {
        refresh();
      }
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener(READER_PREFERENCES_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(READER_PREFERENCES_CHANGED_EVENT, refresh);
    };
  }, []);

  return preferences;
}
