import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ReaderBookmark,
  ReaderPreferencesPayload,
} from '@shared/scripture-search-contracts';
import { readAuthMe } from '@/features/auth/auth-api';
import {
  readReaderState,
  updateReaderState,
} from '@/features/search/scripture-search-api';
import { trackEvent } from '@/lib/telemetry';
import {
  defaultReaderPreferences,
  saveReaderBookmark,
  saveReaderPreferences,
  type ReaderPreferences,
} from './reader-preferences';

function serializeReaderStateSignature(
  preferences: ReaderPreferences,
  bookmark: ReaderBookmark | null,
): string {
  return JSON.stringify({ preferences, bookmark });
}

type UseReaderAccountSyncArgs = {
  readerPreferences: ReaderPreferences;
  bookmark: ReaderBookmark | null;
  setReaderPreferences: (value: ReaderPreferences) => void;
  setBookmark: (value: ReaderBookmark | null) => void;
};

/**
 * Sync reader preferences/bookmark locally and with authenticated account state.
 */
export function useReaderAccountSync({
  readerPreferences,
  bookmark,
  setReaderPreferences,
  setBookmark,
}: UseReaderAccountSyncArgs) {
  const syncDebounceRef = useRef<number | null>(null);
  const lastSyncedSignatureRef = useRef('');
  const isReaderStateHydratingRef = useRef(false);
  const latestReaderPreferencesRef =
    useRef<ReaderPreferences>(readerPreferences);
  const latestBookmarkRef = useRef<ReaderBookmark | null>(bookmark);
  const [isReaderAuthLoading, setIsReaderAuthLoading] = useState(true);
  const [isReaderAuthenticated, setIsReaderAuthenticated] = useState(false);

  useEffect(() => {
    saveReaderPreferences(readerPreferences);
  }, [readerPreferences]);

  useEffect(() => {
    saveReaderBookmark(bookmark);
  }, [bookmark]);

  useEffect(() => {
    let isCancelled = false;
    readAuthMe()
      .then((authPayload) => {
        if (isCancelled) return;
        setIsReaderAuthenticated(authPayload.isAuthenticated);
      })
      .catch(() => {
        if (isCancelled) return;
        setIsReaderAuthenticated(false);
      })
      .finally(() => {
        if (isCancelled) return;
        setIsReaderAuthLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    latestReaderPreferencesRef.current = readerPreferences;
    latestBookmarkRef.current = bookmark;
  }, [bookmark, readerPreferences]);

  useEffect(() => {
    if (isReaderAuthLoading) return;
    const currentSignature = serializeReaderStateSignature(
      latestReaderPreferencesRef.current,
      latestBookmarkRef.current,
    );
    if (!isReaderAuthenticated) {
      isReaderStateHydratingRef.current = false;
      lastSyncedSignatureRef.current = currentSignature;
      return;
    }
    let isCancelled = false;
    isReaderStateHydratingRef.current = true;
    readReaderState()
      .then((payload) => {
        if (isCancelled) return;
        setReaderPreferences(
          payload.preferences ??
            (defaultReaderPreferences as ReaderPreferences),
        );
        setBookmark(payload.bookmark ?? null);
        lastSyncedSignatureRef.current = serializeReaderStateSignature(
          payload.preferences ??
            (defaultReaderPreferences as ReaderPreferences),
          payload.bookmark ?? null,
        );
        trackEvent('reader_state_synced', { source: 'account' });
      })
      .catch(() => {
        if (isCancelled) return;
        lastSyncedSignatureRef.current = currentSignature;
      })
      .finally(() => {
        if (isCancelled) return;
        isReaderStateHydratingRef.current = false;
      });
    return () => {
      isCancelled = true;
    };
  }, [
    isReaderAuthLoading,
    isReaderAuthenticated,
    setBookmark,
    setReaderPreferences,
  ]);

  useEffect(() => {
    if (!isReaderAuthenticated || isReaderStateHydratingRef.current) return;
    const signature = serializeReaderStateSignature(
      readerPreferences,
      bookmark,
    );
    if (signature === lastSyncedSignatureRef.current) return;
    if (syncDebounceRef.current !== null) {
      window.clearTimeout(syncDebounceRef.current);
    }
    syncDebounceRef.current = window.setTimeout(() => {
      updateReaderState({
        preferences: readerPreferences as ReaderPreferencesPayload,
        bookmark,
      })
        .then(() => {
          lastSyncedSignatureRef.current = signature;
          trackEvent('reader_state_synced', { source: 'patch' });
        })
        .catch(() => {
          // Keep reader usable with local persistence when sync fails.
        });
    }, 500);
    return () => {
      if (syncDebounceRef.current !== null) {
        window.clearTimeout(syncDebounceRef.current);
      }
    };
  }, [bookmark, isReaderAuthenticated, readerPreferences]);

  const markCurrentAsSynced = useCallback(
    (
      nextPreferences: ReaderPreferences,
      nextBookmark: ReaderBookmark | null,
    ) => {
      lastSyncedSignatureRef.current = serializeReaderStateSignature(
        nextPreferences,
        nextBookmark,
      );
    },
    [],
  );

  return {
    isReaderAuthLoading,
    isReaderAuthenticated,
    markCurrentAsSynced,
  };
}
