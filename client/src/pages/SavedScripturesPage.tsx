import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BIBLE_BOOKS } from '@shared/bible-books';
import type { SavedScriptureItem } from '@shared/scripture-search-contracts';
import { Button, Card, EmptyState, SectionHeader } from '@/components/ui';
import { readSavedScriptures } from '@/features/search/scripture-search-api';

type SavedBookSummary = {
  book: string;
  savedCount: number;
};

const bookOrderMap = new Map<string, number>(
  BIBLE_BOOKS.map((book, index) => [book, index]),
);

/** Render anonymous device-local saved scripture collection. */
export function SavedScripturesPage() {
  const [savedItems, setSavedItems] = useState<SavedScriptureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    readSavedScriptures()
      .then((rows) => {
        if (!isCancelled) {
          setSavedItems(rows);
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

  const groupedBooks = useMemo<SavedBookSummary[]>(() => {
    const grouped = new Map<string, number>();
    for (const item of savedItems) {
      grouped.set(item.book, (grouped.get(item.book) ?? 0) + 1);
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
  }, [savedItems]);

  return (
    <>
      <SectionHeader
        title="Saved Scriptures"
        description="Your saved verses are grouped by book. Select a book to view and manage saved verses."
      />

      {isLoading && (
        <p className="text-sm text-slate-600">Loading saved books...</p>
      )}

      {!isLoading && error && (
        <EmptyState
          title="Could not load saved books"
          description={error}
          actions={
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      )}

      {!isLoading && !error && savedItems.length === 0 && (
        <EmptyState
          title="No saved books yet"
          description="Go to Search, find a verse, and save it to your collection."
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
    </>
  );
}
