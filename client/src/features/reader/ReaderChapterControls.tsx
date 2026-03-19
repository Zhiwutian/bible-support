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
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-[220px] flex-[2] flex-col gap-1 text-sm font-semibold">
        Book
        <select
          className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
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
      <label className="flex min-w-[120px] flex-1 flex-col gap-1 text-sm font-semibold">
        Chapter
        <input
          className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
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
      <label className="flex min-w-[130px] flex-1 flex-col gap-1 text-sm font-semibold">
        Translation
        <select
          className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
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
