import { TouchEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';
import { useToast } from '@/components/app/toast-context';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SectionHeader,
} from '@/components/ui';
import { getEmotionTheme } from '@/features/emotions/emotion-theme';
import {
  readScriptureContext,
  ScriptureContext,
} from '@/features/emotions/emotion-api';
import {
  toBibleGatewayChapterUrl,
  toChapterReference,
} from '@/features/emotions/scripture-links';
import { useEmotionScriptures } from '@/features/emotions/useEmotionScriptures';
import { saveScripture } from '@/features/search/scripture-search-api';

/**
 * Render scripture viewer for one emotion with arrow and swipe navigation.
 */
export function EmotionScripturePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const touchStartXRef = useRef<number | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<
    'KJV' | 'ASV' | 'WEB'
  >('KJV');
  const selectedScriptureIdFromUrl = Number(
    searchParams.get('scriptureId') ?? '',
  );
  const selectedScriptureId = Number.isInteger(selectedScriptureIdFromUrl)
    ? selectedScriptureIdFromUrl
    : undefined;
  const {
    emotion,
    scriptures,
    currentIndex,
    error,
    isLoading,
    goNext,
    goPrevious,
  } = useEmotionScriptures(slug, selectedTranslation, selectedScriptureId);
  const theme = getEmotionTheme(emotion?.slug ?? slug);
  const [showContext, setShowContext] = useState(false);
  const [contextByScriptureId, setContextByScriptureId] = useState<
    Record<number, ScriptureContext>
  >({});
  const [contextErrorByScriptureId, setContextErrorByScriptureId] = useState<
    Record<number, string>
  >({});
  const [isContextLoadingByScriptureId, setIsContextLoadingByScriptureId] =
    useState<Record<number, boolean>>({});

  const currentScripture = scriptures[currentIndex];
  const canCycle = scriptures.length > 1;
  const currentContext = currentScripture
    ? contextByScriptureId[currentScripture.scriptureId]
    : undefined;
  const currentContextError = currentScripture
    ? (contextErrorByScriptureId[currentScripture.scriptureId] ?? '')
    : '';
  const isCurrentContextLoading = currentScripture
    ? (isContextLoadingByScriptureId[currentScripture.scriptureId] ?? false)
    : false;

  useEffect(() => {
    if (!currentScripture) return;
    const scriptureIdAsString = String(currentScripture.scriptureId);
    if (searchParams.get('scriptureId') === scriptureIdAsString) return;
    const next = new URLSearchParams(searchParams);
    next.set('scriptureId', scriptureIdAsString);
    setSearchParams(next, { replace: true });
  }, [currentScripture, searchParams, setSearchParams]);

  async function handleSaveCurrentScripture() {
    if (!currentScripture) return;
    if (
      !currentScripture.book ||
      !currentScripture.chapter ||
      !currentScripture.verseStart ||
      !currentScripture.verseEnd
    ) {
      showToast({
        title: 'Could not save scripture',
        description:
          'This scripture reference could not be mapped to a saveable verse range.',
        variant: 'error',
      });
      return;
    }
    try {
      await saveScripture({
        translation: currentScripture.translation,
        book: currentScripture.book,
        chapter: currentScripture.chapter,
        verseStart: currentScripture.verseStart,
        verseEnd: currentScripture.verseEnd,
        reference: currentScripture.reference,
        sourceMode: 'local',
        queryText: `support:${emotion?.slug ?? slug ?? 'unknown'}`,
      });
      showToast({
        title: 'Saved scripture',
        description: `${currentScripture.reference} (${currentScripture.translation})`,
        variant: 'success',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not save scripture';
      showToast({
        title: 'Could not save scripture',
        description: message,
        variant: 'error',
      });
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX ?? null;
    if (startX === null || endX === null) return;
    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 40) return;
    if (deltaX < 0) goNext();
    if (deltaX > 0) goPrevious();
  }

  function handleCopyCurrent() {
    if (!currentScripture) return;
    const content = `${currentScripture.reference} (${currentScripture.translation})\n${currentScripture.verseText}`;
    navigator.clipboard
      .writeText(content)
      .then(() =>
        showToast({
          title: 'Copied to clipboard',
          description: currentScripture.reference,
          variant: 'success',
        }),
      )
      .catch(() =>
        showToast({
          title: 'Copy failed',
          description: 'Unable to write to clipboard',
          variant: 'error',
        }),
      );
  }

  function handleOpenFullChapter() {
    if (!currentScripture) return;
    const chapterReference = toChapterReference(currentScripture.reference);
    const url = toBibleGatewayChapterUrl(
      chapterReference,
      currentScripture.translation,
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function handleToggleContext() {
    if (!currentScripture) return;

    const nextIsOpen = !showContext;
    setShowContext(nextIsOpen);
    if (!nextIsOpen) return;

    if (contextByScriptureId[currentScripture.scriptureId]) return;

    setIsContextLoadingByScriptureId((current) => ({
      ...current,
      [currentScripture.scriptureId]: true,
    }));
    setContextErrorByScriptureId((current) => ({
      ...current,
      [currentScripture.scriptureId]: '',
    }));
    try {
      const context = await readScriptureContext({
        scriptureId: currentScripture.scriptureId,
        reference: currentScripture.reference,
      });
      setContextByScriptureId((current) => ({
        ...current,
        [currentScripture.scriptureId]: context,
      }));
      setContextErrorByScriptureId((current) => ({
        ...current,
        [currentScripture.scriptureId]: '',
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not load context';
      setContextErrorByScriptureId((current) => ({
        ...current,
        [currentScripture.scriptureId]: message,
      }));
      showToast({
        title: 'Could not load context',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsContextLoadingByScriptureId((current) => ({
        ...current,
        [currentScripture.scriptureId]: false,
      }));
    }
  }

  function handleOpenFullContext() {
    if (!currentScripture) return;
    const searchParams = new URLSearchParams({
      scriptureId: String(currentScripture.scriptureId),
      reference: currentScripture.reference,
      translation: currentScripture.translation,
    });
    navigate(`/emotions/${emotion?.slug ?? slug}/context?${searchParams}`);
  }

  return (
    <div className={`rounded-xl p-4 ${theme.viewBackgroundClassName}`}>
      <SectionHeader
        title={emotion ? `Scriptures for ${emotion.name}` : 'Scriptures'}
        description="Swipe left/right on mobile or use buttons to navigate fixed-order passages."
        metadata={
          scriptures.length > 0 ? (
            <Badge className={theme.badgeClassName}>
              {currentIndex + 1} / {scriptures.length}
            </Badge>
          ) : undefined
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
          Translation
          <select
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium"
            value={selectedTranslation}
            onChange={(event) =>
              setSelectedTranslation(
                event.target.value as 'KJV' | 'ASV' | 'WEB',
              )
            }>
            {SUPPORTED_SCRIPTURE_TRANSLATIONS.map((translationCode) => (
              <option key={translationCode} value={translationCode}>
                {translationCode}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="ghost"
          className={theme.controlClassName}
          onClick={() => navigate(-1)}>
          Back
        </Button>
        {currentScripture && (
          <Button
            variant="ghost"
            className={theme.controlClassName}
            onClick={handleCopyCurrent}>
            Copy
          </Button>
        )}
        {currentScripture && (
          <Button
            variant="ghost"
            className={theme.controlClassName}
            onClick={() => void handleSaveCurrentScripture()}>
            Save
          </Button>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-slate-600">Loading scriptures...</p>
      )}
      {!isLoading && error && (
        <EmptyState
          title="Could not load scriptures"
          description={error}
          actions={
            <Button variant="ghost" onClick={() => navigate('/')}>
              Return to support
            </Button>
          }
        />
      )}

      {!isLoading && !error && currentScripture && (
        <Card
          className={`mx-auto max-w-prose border p-6 shadow-md ${theme.scriptureContainerClassName}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}>
          <p
            className={`mb-4 text-sm font-semibold tracking-wide ${theme.referenceClassName}`}>
            {currentScripture.reference} ({currentScripture.translation})
          </p>
          {currentScripture.isTranslationFallback ? (
            <p className="mb-3 text-xs text-amber-700">
              Selected translation not available for this reference. Showing{' '}
              {currentScripture.translation} instead.
            </p>
          ) : null}
          <p className="text-xl leading-9 text-slate-800 md:text-2xl">
            {currentScripture.verseText}
          </p>

          <div className="mt-20 space-y-10">
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="ghost"
                className={`w-full justify-center ${theme.controlClassName}`}
                onClick={handleOpenFullChapter}>
                Read full chapter
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-center ${theme.controlClassName}`}
                onClick={handleToggleContext}>
                {showContext ? 'Hide context' : 'Learn context'}
              </Button>

              {showContext && (
                <Card
                  className={`mt-2 border p-4 ${theme.scriptureContextClassName}`}>
                  <p
                    className={`mb-2 text-sm font-semibold ${theme.referenceClassName}`}>
                    Context for {toChapterReference(currentScripture.reference)}
                  </p>
                  {isCurrentContextLoading && (
                    <p className="text-base leading-7 text-slate-700">
                      Loading context...
                    </p>
                  )}
                  {!isCurrentContextLoading && currentContextError && (
                    <p className="text-base leading-7 text-slate-700">
                      Could not load context right now. You can still use "Read
                      full chapter" for complete context.
                    </p>
                  )}
                  {!isCurrentContextLoading &&
                    !currentContextError &&
                    currentContext && (
                      <>
                        <p className="text-base leading-7 text-slate-700">
                          {currentContext.summary}
                        </p>
                        {currentContext.fullContext && (
                          <button
                            type="button"
                            onClick={handleOpenFullContext}
                            className={`mt-2 text-xs underline ${theme.referenceClassName}`}>
                            View full context
                          </button>
                        )}
                        <p
                          className={`mt-2 text-xs ${theme.referenceClassName}`}>
                          Source: {currentContext.sourceName}
                        </p>
                      </>
                    )}
                </Card>
              )}
            </div>

            <div className="flex justify-between">
              <Button
                variant="ghost"
                className={theme.controlClassName}
                onClick={goPrevious}
                disabled={!canCycle}>
                ← Previous
              </Button>
              <Button
                variant="ghost"
                className={theme.controlClassName}
                onClick={goNext}
                disabled={!canCycle}>
                Next →
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
