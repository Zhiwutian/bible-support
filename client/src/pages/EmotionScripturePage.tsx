import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';
import { useToast } from '@/components/app/toast-context';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SectionHeader,
  SettingHelpButton,
  SettingHelpModal,
} from '@/components/ui';
import { appCopy } from '@/lib/copy';
import {
  buildBibleComPassageUrl,
  buildBibleGatewayPassageUrl,
} from '@/lib/study-links';
import { getEmotionTheme } from '@/features/emotions/emotion-theme';
import { useEmotionScriptures } from '@/features/emotions/useEmotionScriptures';
import { buildReaderChapterQuery } from '@/features/reader/build-reader-chapter-url';
import { ReaderSurface } from '@/features/reader/ReaderSurface';
import { saveScripture } from '@/features/search/scripture-search-api';
import { trackEvent } from '@/lib/telemetry';
import { usePreferredTranslation } from '@/state';

/**
 * Render scripture viewer for one emotion with prev/next and outbound study links.
 */
export function EmotionScripturePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { effectivePreferredTranslation, setPreferredTranslation } =
    usePreferredTranslation();
  const [selectedAction, setSelectedAction] = useState('');
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
  } = useEmotionScriptures(
    slug,
    effectivePreferredTranslation,
    selectedScriptureId,
  );
  const theme = getEmotionTheme(emotion?.slug ?? slug);
  const [settingsHelp, setSettingsHelp] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const currentScripture = scriptures[currentIndex];
  const canCycle = scriptures.length > 1;

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
        title: 'We could not save this scripture',
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
        title: 'Scripture saved',
        description: `${currentScripture.reference} (${currentScripture.translation}) was added to your collection.`,
        variant: 'success',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not save scripture';
      showToast({
        title: 'We could not save this scripture',
        description: message,
        variant: 'error',
      });
    }
  }

  function handleCopyCurrent() {
    if (!currentScripture) return;
    const content = `${currentScripture.reference} (${currentScripture.translation})\n${currentScripture.verseText}`;
    if (!navigator.clipboard?.writeText) {
      showToast({
        title: 'Copy did not work',
        description: 'Please try again. Clipboard access may be blocked.',
        variant: 'error',
      });
      return;
    }
    navigator.clipboard
      .writeText(content)
      .then(() =>
        showToast({
          title: 'Copied',
          description: `${currentScripture.reference} copied to your clipboard.`,
          variant: 'success',
        }),
      )
      .catch(() =>
        showToast({
          title: 'Copy did not work',
          description: 'Please try again. Clipboard access may be blocked.',
          variant: 'error',
        }),
      );
  }

  function handleOpenFullChapter() {
    if (!currentScripture) return;
    const translationRequest = effectivePreferredTranslation;
    const query = buildReaderChapterQuery({
      reference: currentScripture.reference,
      verse: currentScripture.verseStart ?? null,
      book: currentScripture.book,
      chapter: currentScripture.chapter,
      translation: translationRequest,
      emotionSlug: emotion?.slug ?? slug ?? null,
      scriptureId: currentScripture.scriptureId,
      fromTranslation: effectivePreferredTranslation,
    });
    if (!query) {
      showToast({
        title: 'We could not open Reader',
        description:
          'This scripture does not include chapter details for reader navigation.',
        variant: 'error',
      });
      return;
    }
    if (query.usedTranslationFallback) {
      showToast({
        title: 'Showing a supported translation',
        description: `${translationRequest} isn’t available in the in-app Reader (only KJV, ASV, and WEB). Opening ${query.effectiveTranslation} instead.`,
        variant: 'info',
      });
    }
    navigate(`/reader?${query.searchParams.toString()}`);
  }

  const bibleComUrl =
    currentScripture &&
    buildBibleComPassageUrl({
      book: currentScripture.book,
      chapter: currentScripture.chapter,
      verse: currentScripture.verseStart,
      translation: effectivePreferredTranslation,
    });
  const bibleGatewayUrl = currentScripture
    ? buildBibleGatewayPassageUrl({
        reference: currentScripture.reference,
        translation: effectivePreferredTranslation,
      })
    : '';

  function handleBackAction() {
    navigate(-1);
  }

  function handleCopyAction() {
    handleCopyCurrent();
  }

  function handleSaveAction() {
    void handleSaveCurrentScripture();
  }

  function handleActionSelect(value: string) {
    if (!value) return;
    if (value === 'back') {
      handleBackAction();
    } else if (value === 'copy') {
      handleCopyAction();
    } else if (value === 'save') {
      handleSaveAction();
    }
    setSelectedAction('');
  }

  return (
    <div
      className={`emotion-support-page w-full min-w-0 rounded-none pb-6 pl-[max(0px,env(safe-area-inset-left))] pr-[max(0px,env(safe-area-inset-right))] md:rounded-xl md:p-4 ${theme.viewBackgroundClassName}`}>
      <SectionHeader
        title={emotion ? `Scriptures for ${emotion.name}` : 'Scriptures'}
        description="Use Previous and Next to move through these curated passages. Your translation choice is remembered across Support, Search, and Reader."
        metadata={
          scriptures.length > 0 ? (
            <Badge className={theme.badgeClassName}>
              {currentIndex + 1} / {scriptures.length}
            </Badge>
          ) : undefined
        }
      />

      <div className="mb-4 flex w-full flex-col items-stretch gap-2 min-[569px]:mx-auto min-[569px]:max-w-prose">
        <div className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
          <div className="mb-2 inline-flex items-center gap-2">
            Translation
            <SettingHelpButton
              settingLabel="Support translation"
              onClick={() =>
                setSettingsHelp({
                  title: 'Translation',
                  description:
                    'Choose which translation to use for Support verses and Reader links. This applies across the app until you change it.',
                })
              }
            />
          </div>
          <select
            aria-label="Translation"
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium"
            value={effectivePreferredTranslation}
            onChange={(event) =>
              setPreferredTranslation(
                event.target.value as ScriptureTranslationCode,
              )
            }>
            {SUPPORTED_SCRIPTURE_TRANSLATIONS.map((translationCode) => (
              <option key={translationCode} value={translationCode}>
                {translationCode}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
          <div className="mb-2 inline-flex items-center gap-2">
            Actions
            <SettingHelpButton
              settingLabel="Support actions"
              onClick={() =>
                setSettingsHelp({
                  title: 'Actions',
                  description:
                    'Choose a quick action for the current support verse: back, copy, or save.',
                })
              }
            />
          </div>
          <select
            aria-label="Actions"
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium"
            value={selectedAction}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedAction(value);
              handleActionSelect(value);
            }}>
            <option value="">Choose an action...</option>
            <option value="back">Back</option>
            <option value="copy" disabled={!currentScripture}>
              Copy
            </option>
            <option value="save" disabled={!currentScripture}>
              Save
            </option>
          </select>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-slate-600">{appCopy.loading.verses}</p>
      )}
      {!isLoading && error && (
        <EmptyState
          title="We could not load these scriptures"
          description={error}
          actions={
            <Button variant="ghost" onClick={() => navigate('/')}>
              {appCopy.actions.goToSupport}
            </Button>
          }
        />
      )}

      {!isLoading && !error && currentScripture && (
        <Card
          className={`w-full max-w-none rounded-none border-x-0 border-y px-0 py-4 shadow-md min-[569px]:mx-auto min-[569px]:max-w-prose min-[569px]:rounded-md min-[569px]:border-x min-[569px]:py-6 ${theme.scriptureContainerClassName}`}>
          <p
            className={`mb-4 px-4 text-sm font-semibold tracking-wide min-[569px]:px-6 ${theme.referenceClassName}`}>
            {currentScripture.reference} ({currentScripture.translation})
          </p>
          {currentScripture.isTranslationFallback ? (
            <p className="mb-3 px-4 text-xs text-amber-700 min-[569px]:px-6">
              Selected translation not available for this reference. Showing{' '}
              {currentScripture.translation} instead.
            </p>
          ) : null}
          <ReaderSurface className="mt-1" fullWidth>
            <p className="text-xl leading-9 md:text-2xl">
              {currentScripture.verseText}
            </p>
          </ReaderSurface>

          <div className="mt-8 space-y-6 px-4 min-[569px]:px-6">
            <div className="flex justify-between gap-2">
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

            <div className="relative flex items-center">
              <Button
                variant="ghost"
                className={`min-h-11 w-full justify-center pr-12 ${theme.controlClassName}`}
                onClick={handleOpenFullChapter}>
                <span>Read full chapter</span>
              </Button>
              <div className="pointer-events-none absolute right-2">
                <div className="pointer-events-auto">
                  <SettingHelpButton
                    settingLabel="Read full chapter"
                    onClick={() =>
                      setSettingsHelp({
                        title: 'Read full chapter',
                        description:
                          'Open the in-app Reader to this book and chapter using your saved translation.',
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p
                className={`text-sm font-semibold ${theme.referenceClassName}`}>
                Study online
              </p>
              <p className="text-xs text-slate-600">
                Opens Bible.com or BibleGateway in a new tab. Content and terms
                are governed by those sites.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {bibleComUrl ? (
                  <a
                    href={bibleComUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 underline-offset-2 hover:underline ${theme.controlClassName}`}
                    onClick={() =>
                      trackEvent('study_link_opened', { provider: 'bible_com' })
                    }>
                    Open passage on Bible.com
                  </a>
                ) : null}
                <a
                  href={bibleGatewayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 underline-offset-2 hover:underline ${theme.controlClassName}`}
                  onClick={() =>
                    trackEvent('study_link_opened', {
                      provider: 'bible_gateway',
                    })
                  }>
                  Open passage on BibleGateway
                </a>
              </div>
            </div>
          </div>
        </Card>
      )}
      <SettingHelpModal
        help={settingsHelp}
        titleId="emotion-settings-help-title"
        onClose={() => setSettingsHelp(null)}
      />
    </div>
  );
}
