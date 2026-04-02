import { useEffect, useState } from 'react';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts';
import {
  readEmotionScriptures,
  type ScriptureQuote,
} from '@/features/emotions/emotion-api';
import type { ReaderPreferences } from '@/features/reader/reader-preferences';

type ReaderSupportVerseCalloutProps = {
  emotionSlug: string;
  scriptureId: number;
  fromTranslation: string | undefined;
  readerTranslation: ScriptureTranslationCode;
  readerPreferences: ReaderPreferences;
  stripTranslationIndicators: (value: string) => string;
};

/**
 * Loads the Support verse quote for in-reader context when arriving from Emotions.
 */
export function ReaderSupportVerseCallout({
  emotionSlug,
  scriptureId,
  fromTranslation,
  readerTranslation,
  readerPreferences,
  stripTranslationIndicators,
}: ReaderSupportVerseCalloutProps) {
  const [quote, setQuote] = useState<ScriptureQuote | null>(null);

  useEffect(() => {
    let cancelled = false;
    const trans =
      fromTranslation &&
      SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(
        fromTranslation.toUpperCase() as ScriptureTranslationCode,
      )
        ? (fromTranslation.toUpperCase() as ScriptureTranslationCode)
        : readerTranslation;
    void readEmotionScriptures(emotionSlug, trans)
      .then((payload) => {
        if (cancelled) return;
        const found = payload.scriptures.find(
          (row) => row.scriptureId === scriptureId,
        );
        setQuote(found ?? null);
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [emotionSlug, fromTranslation, readerTranslation, scriptureId]);

  if (!quote) return null;

  return (
    <div className="rounded-md border border-indigo-200 bg-indigo-50/90 p-3 text-slate-900 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800 dark:text-indigo-200">
        Support verse
      </p>
      <p className="mt-1 text-sm font-semibold">
        {quote.reference} ({quote.translation})
      </p>
      <p className="mt-2 text-base leading-relaxed">
        {readerPreferences.hideTranslationIndicators
          ? stripTranslationIndicators(quote.verseText)
          : quote.verseText}
      </p>
    </div>
  );
}
