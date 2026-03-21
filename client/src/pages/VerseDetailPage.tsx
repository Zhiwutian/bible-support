import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ScriptureVerseResult } from '@shared/scripture-search-contracts';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SectionHeader,
} from '@/components/ui';
import { getLastReaderTo } from '@/features/reader/last-reader-location';
import { searchScriptures } from '@/features/search/scripture-search-api';
import { appCopy } from '@/lib/copy';
import { trackEvent } from '@/lib/telemetry';
import {
  buildAbsoluteVerseShareUrl,
  buildReaderPathForSharedVerse,
  parseVerseShareParams,
  shareVerseLink,
  toVerseShareSearchParams,
} from '@/lib/verse-sharing';

/** Render a public verse detail view for shared links. */
export function VerseDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadState, setLoadState] = useState<{
    key: string;
    verseRow: ScriptureVerseResult | null;
    error: string;
  }>({
    key: '',
    verseRow: null,
    error: '',
  });
  const [shareStatus, setShareStatus] = useState('');
  const params = useMemo(
    () => parseVerseShareParams(searchParams),
    [searchParams],
  );
  const currentVerseKey = params
    ? `${params.translation}:${params.book}:${params.chapter}:${params.verse}`
    : '';
  const isLoading = Boolean(params) && loadState.key !== currentVerseKey;
  const error = loadState.key === currentVerseKey ? loadState.error : '';
  const verseRow =
    loadState.key === currentVerseKey ? loadState.verseRow : null;

  useEffect(() => {
    if (!params) return;
    const canonical = toVerseShareSearchParams(params);
    if (canonical === searchParams.toString()) return;
    navigate(`/verse?${canonical}`, { replace: true });
  }, [navigate, params, searchParams]);

  useEffect(() => {
    if (params) {
      document.title = `${params.book} ${params.chapter}:${params.verse} (${params.translation}) | Scripture & Solace`;
      return () => {
        document.title = 'Scripture & Solace';
      };
    }
    document.title = 'Shared Verse | Scripture & Solace';
    return () => {
      document.title = 'Scripture & Solace';
    };
  }, [params]);

  useEffect(() => {
    trackEvent('verse_detail_opened', {
      hasValidParams: Boolean(params),
      book: params?.book,
      chapter: params?.chapter,
      verse: params?.verse,
      translation: params?.translation,
    });
  }, [params]);

  useEffect(() => {
    if (!params) return;
    let isCancelled = false;
    const key = `${params.translation}:${params.book}:${params.chapter}:${params.verse}`;
    searchScriptures({
      mode: 'reference',
      q: `${params.book} ${params.chapter}:${params.verse}`,
      translation: params.translation,
      limit: 10,
    })
      .then((response) => {
        if (isCancelled) return;
        const match =
          response.verses.find(
            (item) =>
              item.book.toLowerCase() === params.book.toLowerCase() &&
              item.chapter === params.chapter &&
              item.verse === params.verse &&
              item.translation === params.translation,
          ) ?? null;
        setLoadState({
          key,
          verseRow: match,
          error: '',
        });
      })
      .catch((err) => {
        if (isCancelled) return;
        setLoadState({
          key,
          verseRow: null,
          error: err instanceof Error ? err.message : 'Could not load verse',
        });
      });
    return () => {
      isCancelled = true;
    };
  }, [params]);

  async function handleShareAction() {
    if (!params) return;
    const url = buildAbsoluteVerseShareUrl(params);
    try {
      const outcome = await shareVerseLink({
        title: `${params.book} ${params.chapter}:${params.verse} (${params.translation})`,
        text:
          verseRow?.verseText ??
          `${params.book} ${params.chapter}:${params.verse}`,
        url,
      });
      if (outcome === 'shared') {
        setShareStatus(appCopy.status.openedShareOptions);
        trackEvent('share_native_success', {
          source: 'verse_detail',
          ...params,
        });
        return;
      }
      if (outcome === 'copied') {
        setShareStatus(appCopy.status.copiedShareLink);
        trackEvent('share_fallback_copy_success', {
          source: 'verse_detail',
          ...params,
        });
        return;
      }
      setShareStatus(appCopy.status.shareCanceled);
    } catch (err) {
      setShareStatus(
        err instanceof Error ? err.message : appCopy.errors.couldNotShareVerse,
      );
      trackEvent('share_failed', {
        source: 'verse_detail',
        ...params,
        message: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  async function handleCopyLink() {
    if (!params || !navigator.clipboard?.writeText) {
      setShareStatus(appCopy.errors.shareUnavailable);
      return;
    }
    const url = buildAbsoluteVerseShareUrl(params);
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus(appCopy.status.copiedShareLink);
    } catch {
      setShareStatus(appCopy.errors.copyFailed);
    }
  }

  const recoveryActions = (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="ghost"
        className="min-h-11"
        onClick={() => navigate(getLastReaderTo())}>
        {appCopy.actions.openReader}
      </Button>
      <Button
        variant="ghost"
        className="min-h-11"
        onClick={() => navigate('/search')}>
        {appCopy.actions.openSearch}
      </Button>
      <Button
        variant="ghost"
        className="min-h-11"
        onClick={() => navigate('/')}>
        {appCopy.actions.goToSupport}
      </Button>
    </div>
  );

  return (
    <>
      <SectionHeader
        title="Shared Verse"
        description="Review this verse, then open Reader or navigate to other routes."
      />
      {!params && (
        <EmptyState
          title="Shared link is incomplete"
          description="This link is missing required verse details."
          actions={recoveryActions}
        />
      )}
      {params && (
        <Card className="space-y-4 border p-4">
          <div className="flex items-center gap-2">
            <Badge>Shared link</Badge>
            <p className="text-xs text-slate-600">
              You can open Reader or Search from this shared verse view.
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {params.book} {params.chapter}:{params.verse} ({params.translation})
          </p>
          {isLoading && (
            <p className="text-sm text-slate-600">Loading verse...</p>
          )}
          {!isLoading && error && (
            <p className="text-sm text-rose-700" role="alert">
              {error}
            </p>
          )}
          {!isLoading && !error && !verseRow && (
            <EmptyState
              title="Verse not found"
              description="We could not find that verse in the selected translation yet."
              actions={recoveryActions}
            />
          )}
          {!isLoading && !error && verseRow && (
            <p className="text-lg leading-8 text-slate-800">
              {verseRow.verseText}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => navigate(buildReaderPathForSharedVerse(params))}>
              Open in Reader
            </Button>
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => navigate('/search')}>
              {appCopy.actions.openSearch}
            </Button>
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => navigate('/')}>
              {appCopy.actions.goToSupport}
            </Button>
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => {
                void handleCopyLink();
              }}>
              {appCopy.actions.copyLink}
            </Button>
            <Button
              variant="primary"
              className="min-h-11"
              onClick={() => {
                void handleShareAction();
              }}>
              {appCopy.actions.shareVerse}
            </Button>
          </div>
          {shareStatus ? (
            <p className="text-sm text-slate-600" role="status">
              {shareStatus}
            </p>
          ) : null}
          <p className="text-xs text-slate-500">
            If you are not signed in, some routes may prompt guest entry first.
          </p>
        </Card>
      )}
    </>
  );
}
