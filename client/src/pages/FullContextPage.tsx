import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/app/toast-context';
import {
  Button,
  Card,
  EmptyState,
  SectionHeader,
  SettingHelpButton,
  SettingHelpModal,
} from '@/components/ui';
import { appCopy } from '@/lib/copy';
import {
  readScriptureContext,
  ScriptureContext,
} from '@/features/emotions/emotion-api';
import { getEmotionTheme } from '@/features/emotions/emotion-theme';
import {
  toBibleGatewayChapterUrl,
  toChapterReference,
} from '@/features/emotions/scripture-links';

/**
 * Render a dedicated full-context reading page for one scripture reference.
 */
export function FullContextPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const theme = getEmotionTheme(slug);
  const scriptureIdParam = searchParams.get('scriptureId');
  const scriptureId =
    scriptureIdParam && /^\d+$/.test(scriptureIdParam)
      ? Number(scriptureIdParam)
      : undefined;
  const reference = searchParams.get('reference') ?? '';
  const translation = searchParams.get('translation') ?? 'NIV';
  const [context, setContext] = useState<ScriptureContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [settingsHelp, setSettingsHelp] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const chapterReference =
    context?.chapterReference || toChapterReference(reference);

  function handleOpenFullChapter() {
    if (!chapterReference) return;
    const url = toBibleGatewayChapterUrl(chapterReference, translation);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => {
    let isCancelled = false;
    if (!reference && scriptureId === undefined) {
      if (!isCancelled) {
        setError('Scripture id or reference is missing.');
        setIsLoading(false);
      }
      return;
    }

    async function loadContext() {
      setIsLoading(true);
      setError('');
      try {
        const scriptureContext = await readScriptureContext({
          scriptureId,
          reference: reference || undefined,
        });
        if (isCancelled) return;
        setContext(scriptureContext);
      } catch (err) {
        if (isCancelled) return;
        const message =
          err instanceof Error ? err.message : 'Could not load full context';
        setError(message);
        showToast({
          title: 'We could not load full context',
          description: message,
          variant: 'error',
        });
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadContext();
    return () => {
      isCancelled = true;
    };
  }, [reference, scriptureId, showToast]);

  const contextParagraphs = useMemo(() => {
    const text = context?.fullContext || context?.summary || '';
    return text.split('\n\n').filter(Boolean);
  }, [context]);

  return (
    <div className={`rounded-xl p-4 ${theme.viewBackgroundClassName}`}>
      <SectionHeader
        title="Full Context"
        description={`Reference: ${reference}${translation ? ` (${translation})` : ''}.`}
        metadata={
          <SettingHelpButton
            settingLabel="Full context page"
            onClick={() =>
              setSettingsHelp({
                title: 'Full Context',
                description:
                  'This page loads a longer explanation for the passage (summary and extended text) with source attribution. Back to scripture returns to the Support verse list. Read full chapter opens BibleGateway in a new tab for the whole chapter—handy when you want external chapter reading. This is separate from in-app Reader, which you can open from Support or Search for bookmarks and verse actions.',
              })
            }
          />
        }
      />

      <div className="mb-6 flex items-center gap-2">
        <Button
          variant="ghost"
          className={theme.controlClassName}
          onClick={() => navigate(-1)}>
          Back to scripture
        </Button>
        <Button
          variant="ghost"
          className={theme.controlClassName}
          onClick={handleOpenFullChapter}
          disabled={!chapterReference}>
          Read full chapter
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-slate-700">{appCopy.loading.context}</p>
      )}
      {!isLoading && error && (
        <EmptyState
          title="We could not load full context"
          description={error}
          actions={
            <Button
              variant="ghost"
              className={theme.controlClassName}
              onClick={() => navigate(-1)}>
              Go Back
            </Button>
          }
        />
      )}

      {!isLoading && !error && context && (
        <Card
          className={`mx-auto max-w-prose border p-6 shadow-md ${theme.scriptureContextClassName}`}>
          <p
            className={`mb-4 text-sm font-semibold ${theme.referenceClassName}`}>
            Context for {context.chapterReference}
          </p>
          <div className="space-y-5">
            {contextParagraphs.map((paragraph, index) => (
              <p
                key={`context-paragraph-${index}`}
                className="text-lg leading-8 text-slate-800">
                {paragraph}
              </p>
            ))}
          </div>
          <p className={`mt-4 text-xs ${theme.referenceClassName}`}>
            Source: {context.sourceName}
          </p>
        </Card>
      )}
      <SettingHelpModal
        help={settingsHelp}
        titleId="full-context-settings-help-title"
        onClose={() => setSettingsHelp(null)}
      />
    </div>
  );
}
