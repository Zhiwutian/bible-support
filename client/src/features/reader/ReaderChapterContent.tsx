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
  hasSavedNoteForVerse: (verse: number) => boolean;
  formatVerseText: (verseText: string) => string;
  onOpenVerseActions: (verse: number, verseText: string) => void;
};

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
  hasSavedNoteForVerse,
  formatVerseText,
  onOpenVerseActions,
}: ReaderChapterContentProps) {
  return (
    <div className="reader-chapter-text">
      {readingStyle === 'verse' &&
        payload.verses.map((verse) => (
          <button
            key={verse.reference}
            type="button"
            data-verse-start={verse.verse}
            data-verse-end={verse.verse}
            className={`reader-verse-paragraph block w-full rounded px-1 text-left ${
              isBookmarkedVerse(verse.verse) ? 'ring-1 ring-indigo-400' : ''
            }`}
            onClick={() => onOpenVerseActions(verse.verse, verse.verseText)}>
            <sup className="mr-1 align-super text-xs font-semibold">
              {verse.verse}
            </sup>
            {formatVerseText(verse.verseText)}
            {hasSavedNoteForVerse(verse.verse) ? (
              <sup
                aria-label={`Has note for ${book} ${chapter}:${verse.verse}`}
                className="ml-1 align-super text-[0.65rem] font-semibold text-indigo-700">
                n
              </sup>
            ) : null}
          </button>
        ))}
      {readingStyle === 'standard' &&
        cleanParagraphs.map((paragraph) => (
          <div
            key={paragraph.key}
            data-verse-start={paragraph.verses[0]?.verse}
            data-verse-end={
              paragraph.verses[paragraph.verses.length - 1]?.verse
            }
            className={`reader-verse-paragraph block w-full rounded px-1 text-left ${
              isBookmarkedVerse(paragraph.firstVerse)
                ? 'ring-1 ring-indigo-400'
                : ''
            }`}>
            {paragraph.verses.map((entry) => (
              <span
                key={`${paragraph.key}-${entry.verse}`}
                role="button"
                tabIndex={0}
                aria-label={`Open actions for ${book} ${chapter}:${entry.verse}`}
                className="reader-verse-inline-hit inline cursor-pointer rounded px-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                onClick={() => onOpenVerseActions(entry.verse, entry.verseText)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  onOpenVerseActions(entry.verse, entry.verseText);
                }}>
                <sup className="mr-1 align-super text-xs font-semibold text-indigo-700">
                  {entry.verse}
                </sup>
                {entry.verseText}
                {hasSavedNoteForVerse(entry.verse) ? (
                  <sup
                    aria-label={`Has note for ${book} ${chapter}:${entry.verse}`}
                    className="ml-1 mr-1 align-super text-[0.55rem] font-semibold text-indigo-700">
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
            className={`reader-verse-paragraph block w-full rounded px-1 text-left ${
              isBookmarkedVerse(paragraph.firstVerse)
                ? 'ring-1 ring-indigo-400'
                : ''
            }`}>
            {paragraph.verses.map((entry) => (
              <span
                key={`${paragraph.key}-clean-${entry.verse}`}
                role="button"
                tabIndex={0}
                aria-label={`Open actions for ${book} ${chapter}:${entry.verse}`}
                className="reader-verse-inline-hit inline cursor-pointer rounded px-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                onClick={() => onOpenVerseActions(entry.verse, entry.verseText)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  onOpenVerseActions(entry.verse, entry.verseText);
                }}>
                {entry.verseText}
                {hasSavedNoteForVerse(entry.verse) ? (
                  <sup
                    aria-label={`Has note for ${book} ${chapter}:${entry.verse}`}
                    className="ml-1 mr-1 align-super text-[0.55rem] font-semibold text-indigo-700">
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
