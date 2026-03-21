/**
 * Parse reference keys from bundled full-bible JSON maps
 * (`"Genesis 1:1" -> verse text`).
 */
export function parseBibleJsonMapReference(reference: string): {
  book: string;
  chapter: number;
  verse: number;
} | null {
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return null;
  const [, bookPart, chapterPart, versePart] = match;
  const chapter = Number(chapterPart);
  const verse = Number(versePart);
  if (!Number.isInteger(chapter) || chapter <= 0) return null;
  if (!Number.isInteger(verse) || verse <= 0) return null;

  const book = bookPart.trim() === 'Psalm' ? 'Psalms' : bookPart.trim();
  return { book, chapter, verse };
}

/** Normalize verse text from upstream JSON (paragraph markers, whitespace). */
export function normalizeBibleJsonVerseText(text: string): string {
  return text.replace(/^#\s*/, '').replace(/\s+/g, ' ').trim();
}
