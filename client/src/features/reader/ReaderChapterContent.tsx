import type { ReaderChapterResponse } from '@shared/scripture-search-contracts';
import type { ReaderPreferences } from './reader-preferences';

export type ReaderCleanParagraph = {
  key: string;
  firstVerse: number;
  text: string;
  verses: Array<{ verse: number; verseText: string }>;
};

type ReaderChapterContentProps = {
  payload: ReaderChapterResponse;
  book: string;
  chapter: number;
  readingStyle: ReaderPreferences['readingStyle'];
  cleanParagraphs: ReaderCleanParagraph[];
  isBookmarkedVerse: (verse: number) => boolean;
  hasSavedScriptureForVerse: (verse: number) => boolean;
  hasSavedNoteForVerse: (verse: number) => boolean;
  formatVerseText: (verseText: string) => string;
  onOpenVerseActions: (verse: number, verseText: string) => void;
};

function verseRowClassName(
  verse: number,
  isBookmarkedVerse: (v: number) => boolean,
  hasSavedScriptureForVerse: (v: number) => boolean,
): string {
  const b = isBookmarkedVerse(verse);
  const s = hasSavedScriptureForVerse(verse);
  const base = 'reader-verse-paragraph block w-full rounded px-1 text-left';
  if (b && s) return `${base} ring-2 ring-indigo-400 bg-emerald-500/10`;
  if (b) return `${base} ring-1 ring-indigo-400`;
  if (s) return `${base} ring-1 ring-emerald-600/40 bg-emerald-500/5`;
  return base;
}

/**
 * Reader chapter text surface with style-specific verse rendering.
 */
export function ReaderChapterContent({
  payload,
  book,
  chapter,
  readingStyle,
  cleanParagraphs,
  isBookmarkedVerse,
  hasSavedScriptureForVerse,
  hasSavedNoteForVerse,
  formatVerseText,
  onOpenVerseActions,
}: ReaderChapterContentProps) {
  return (
    <div className="reader-chapter-text">
      {readingStyle === 'verse' &&
        payload.verses.map((verse) => (
          <div
            key={verse.reference}
            data-verse-start={verse.verse}
            data-verse-end={verse.verse}
            className={verseRowClassName(
              verse.verse,
              isBookmarkedVerse,
              hasSavedScriptureForVerse,
            )}>
            <sup className="mr-1 align-super text-[0.75em] font-semibold leading-none">
              {verse.verse}
            </sup>
            <button
              type="button"
              className="reader-verse-text-hit inline max-w-full cursor-pointer rounded border-0 bg-transparent px-0.5 py-0 text-left align-baseline font-inherit text-inherit focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
              onClick={(event) => {
                event.stopPropagation();
                onOpenVerseActions(verse.verse, verse.verseText);
              }}>
              {formatVerseText(verse.verseText)}
            </button>
            {hasSavedNoteForVerse(verse.verse) ? (
              <sup
                aria-label={`Has note for ${book} ${chapter}:${verse.verse}`}
                className="ml-1 align-super text-[0.55em] font-semibold leading-none text-indigo-700">
                n
              </sup>
            ) : null}
          </div>
        ))}
      {readingStyle === 'standard' &&
        cleanParagraphs.map((paragraph) => (
          <div
            key={paragraph.key}
            data-verse-start={paragraph.verses[0]?.verse}
            data-verse-end={
              paragraph.verses[paragraph.verses.length - 1]?.verse
            }
            className={
              paragraph.verses.some(
                (entry) =>
                  isBookmarkedVerse(entry.verse) ||
                  hasSavedScriptureForVerse(entry.verse),
              )
                ? 'reader-verse-paragraph block w-full rounded px-1 py-0.5 text-left ring-1 ring-slate-300/40'
                : 'reader-verse-paragraph block w-full rounded px-1 text-left'
            }>
            {paragraph.verses.map((entry) => (
              <span
                key={`${paragraph.key}-${entry.verse}`}
                className={`inline ${
                  isBookmarkedVerse(entry.verse) ? 'ring-1 ring-indigo-400' : ''
                } ${
                  hasSavedScriptureForVerse(entry.verse)
                    ? 'bg-emerald-500/10'
                    : ''
                }`}>
                <sup className="mr-1 align-super text-[0.75em] font-semibold leading-none text-indigo-700">
                  {entry.verse}
                </sup>
                <span
                  role="button"
                  tabIndex={0}
                  className="reader-verse-text-hit inline cursor-pointer rounded px-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenVerseActions(entry.verse, entry.verseText);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    event.stopPropagation();
                    onOpenVerseActions(entry.verse, entry.verseText);
                  }}>
                  {entry.verseText}
                </span>
                {hasSavedNoteForVerse(entry.verse) ? (
                  <sup
                    aria-label={`Has note for ${book} ${chapter}:${entry.verse}`}
                    className="ml-1 mr-1 align-super text-[0.5em] font-semibold leading-none text-indigo-700">
                    n
                  </sup>
                ) : null}{' '}
              </span>
            ))}
          </div>
        ))}
      {readingStyle === 'clean' &&
        cleanParagraphs.map((paragraph) => (
          <div
            key={paragraph.key}
            data-verse-start={paragraph.verses[0]?.verse}
            data-verse-end={
              paragraph.verses[paragraph.verses.length - 1]?.verse
            }
            className={
              paragraph.verses.some(
                (entry) =>
                  isBookmarkedVerse(entry.verse) ||
                  hasSavedScriptureForVerse(entry.verse),
              )
                ? 'reader-verse-paragraph block w-full rounded px-1 py-0.5 text-left ring-1 ring-slate-300/40'
                : 'reader-verse-paragraph block w-full rounded px-1 text-left'
            }>
            {paragraph.verses.map((entry) => (
              <span
                key={`${paragraph.key}-clean-${entry.verse}`}
                className={`inline ${
                  isBookmarkedVerse(entry.verse) ? 'ring-1 ring-indigo-400' : ''
                } ${
                  hasSavedScriptureForVerse(entry.verse)
                    ? 'bg-emerald-500/10'
                    : ''
                }`}>
                <span
                  role="button"
                  tabIndex={0}
                  className="reader-verse-text-hit inline cursor-pointer rounded px-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenVerseActions(entry.verse, entry.verseText);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    event.stopPropagation();
                    onOpenVerseActions(entry.verse, entry.verseText);
                  }}>
                  {entry.verseText}
                </span>
                {hasSavedNoteForVerse(entry.verse) ? (
                  <sup
                    aria-label={`Has note for ${book} ${chapter}:${entry.verse}`}
                    className="ml-1 mr-1 align-super text-[0.5em] font-semibold leading-none text-indigo-700">
                    n
                  </sup>
                ) : null}{' '}
              </span>
            ))}
          </div>
        ))}
    </div>
  );
}
