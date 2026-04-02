import { BIBLE_BOOKS } from '@shared/bible-books';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';

type ReaderChapterControlsProps = {
  book: string;
  chapterInputValue: string;
  maxChapterForBook: number;
  translation: ScriptureTranslationCode;
  onBookChange: (nextBook: string) => void;
  onChapterInputChange: (nextValue: string) => void;
  onChapterInputBlur: () => void;
  onTranslationChange: (nextTranslation: ScriptureTranslationCode) => void;
};

/**
 * Reader chapter/translation controls extracted from page layout.
 */
export function ReaderChapterControls({
  book,
  chapterInputValue,
  maxChapterForBook,
  translation,
  onBookChange,
  onChapterInputChange,
  onChapterInputBlur,
  onTranslationChange,
}: ReaderChapterControlsProps) {
  const chapterSelectValue = chapterInputValue === '' ? '1' : chapterInputValue;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
      <label className="flex w-full min-w-0 flex-col gap-1 text-sm font-semibold md:max-w-none md:flex-[2]">
        Book
        <select
          className="min-h-11 w-full min-w-0 max-w-full rounded-md border border-slate-300 bg-white px-3 py-2"
          value={book}
          onChange={(event) => {
            onBookChange(event.target.value);
          }}>
          {BIBLE_BOOKS.map((bookName) => (
            <option key={bookName} value={bookName}>
              {bookName}
            </option>
          ))}
        </select>
      </label>
      <label className="flex w-full min-w-0 flex-col gap-1 text-sm font-semibold md:flex-1">
        Chapter
        <select
          className="min-h-11 w-full min-w-0 max-w-full rounded-md border border-slate-300 bg-white px-3 py-2 md:hidden"
          aria-label="Chapter"
          value={chapterSelectValue}
          onChange={(event) => {
            onChapterInputChange(event.target.value);
          }}>
          {Array.from(
            { length: maxChapterForBook },
            (_, index) => index + 1,
          ).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <input
          className="hidden min-h-11 w-full min-w-0 max-w-full rounded-md border border-slate-300 bg-white px-3 py-2 md:block"
          type="number"
          min={1}
          max={maxChapterForBook}
          value={chapterInputValue}
          onChange={(event) => {
            onChapterInputChange(event.target.value);
          }}
          onBlur={onChapterInputBlur}
          aria-label="Chapter"
        />
      </label>
      <label className="flex w-full min-w-0 flex-col gap-1 text-sm font-semibold md:flex-1">
        Translation
        <select
          className="min-h-11 w-full min-w-0 max-w-full rounded-md border border-slate-300 bg-white px-3 py-2"
          value={translation}
          onChange={(event) =>
            onTranslationChange(event.target.value as ScriptureTranslationCode)
          }>
          {SUPPORTED_SCRIPTURE_TRANSLATIONS.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
