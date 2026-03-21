import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BIBLE_BOOKS } from '@shared/bible-books';
import type { SavedScriptureGroup } from '@shared/saved-scripture-contracts';
import {
  Button,
  Card,
  EmptyState,
  SectionHeader,
  SettingHelpButton,
  SettingHelpModal,
} from '@/components/ui';
import { readSavedScriptureGroups } from '@/features/search/scripture-search-api';
import { appCopy } from '@/lib/copy';
import {
  readRouteState,
  savedIndexRouteStateSchema,
  writeRouteState,
} from '@/lib/route-session-state';

const SAVED_INDEX_ROUTE_PATH = '/saved';

type SavedBookSummary = {
  book: string;
  savedCount: number;
};

const bookOrderMap = new Map<string, number>(
  BIBLE_BOOKS.map((book, index) => [book, index]),
);

/** Render anonymous device-local saved scripture collection. */
export function SavedScripturesPage() {
  const [groups, setGroups] = useState<SavedScriptureGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [settingsHelp, setSettingsHelp] = useState<{
    title: string;
    description: string;
  } | null>(null);
  useEffect(() => {
    const saved = readRouteState(
      SAVED_INDEX_ROUTE_PATH,
      savedIndexRouteStateSchema,
    );
    if (saved) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved.scrollY, left: 0, behavior: 'auto' });
      });
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    readSavedScriptureGroups()
      .then((response) => {
        if (!isCancelled) {
          setGroups(response.groups);
          setError('');
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Could not load saves');
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    let timeoutId: number | undefined;
    function onScroll() {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        timeoutId = undefined;
        writeRouteState(SAVED_INDEX_ROUTE_PATH, {
          version: 1,
          scrollY: Math.max(0, window.scrollY),
        });
      }, 200);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      writeRouteState(SAVED_INDEX_ROUTE_PATH, {
        version: 1,
        scrollY: Math.max(0, window.scrollY),
      });
    };
  }, [isLoading]);

  const groupedBooks = useMemo<SavedBookSummary[]>(() => {
    const grouped = new Map<string, number>();
    for (const group of groups) {
      for (const item of group.items) {
        grouped.set(item.book, (grouped.get(item.book) ?? 0) + 1);
      }
    }

    return [...grouped.entries()]
      .map(([book, savedCount]) => ({ book, savedCount }))
      .sort((a, b) => {
        const orderA = bookOrderMap.get(a.book);
        const orderB = bookOrderMap.get(b.book);
        if (orderA !== undefined && orderB !== undefined)
          return orderA - orderB;
        if (orderA !== undefined) return -1;
        if (orderB !== undefined) return 1;
        return a.book.localeCompare(b.book);
      });
  }, [groups]);

  return (
    <>
      <SectionHeader
        title="Saved Scriptures"
        description="Your saved verses are grouped by book so you can quickly review, edit, and reopen them."
        metadata={
          <SettingHelpButton
            settingLabel="Saved scriptures index"
            onClick={() =>
              setSettingsHelp({
                title: 'Saved Scriptures',
                description:
                  'Each card is a Bible book that contains at least one saved verse; the count shows how many verses you saved there. Open a book to edit notes, change translation where offered, remove entries, or open a verse in Reader. Scroll position on this list and on each book page is restored when you return in the same browser tab.',
              })
            }
          />
        }
      />

      {isLoading && (
        <p className="text-sm text-slate-600">{appCopy.loading.savedBooks}</p>
      )}

      {!isLoading && error && (
        <EmptyState
          title="We could not load your saved books"
          description={error}
          actions={
            <Button variant="ghost" onClick={() => window.location.reload()}>
              {appCopy.actions.retry}
            </Button>
          }
        />
      )}

      {!isLoading && !error && groups.length === 0 && (
        <EmptyState
          title="No saved books yet"
          description="Start in Search, save a verse, and it will appear here."
        />
      )}

      {!isLoading && !error && groupedBooks.length > 0 && (
        <div className="space-y-3">
          {groupedBooks.map((group) => (
            <Link
              key={group.book}
              to={`/saved/${encodeURIComponent(group.book)}`}
              className="block">
              <Card className="space-y-2 border p-4 transition hover:bg-slate-50">
                <p className="text-base font-semibold text-slate-800">
                  {group.book}
                </p>
                <p className="text-sm text-slate-700">
                  {group.savedCount} saved verse(s)
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <SettingHelpModal
        help={settingsHelp}
        titleId="saved-index-settings-help-title"
        onClose={() => setSettingsHelp(null)}
      />
    </>
  );
}
