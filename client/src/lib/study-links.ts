import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts';
import { bookNameToUsfm } from '@/lib/bible-book-usfm';

/** YouVersion / Bible.com version ids (public quick-reference examples + common KJV). */
const YV_VERSION_BY_TRANSLATION: Record<ScriptureTranslationCode, number> = {
  KJV: 1,
  ASV: 12,
  WEB: 206,
};

/**
 * Bible.com passage URL (opens in browser). Uses USFM chapter.verse for a single start verse.
 */
export function buildBibleComPassageUrl(input: {
  book: string | null | undefined;
  chapter: number | null | undefined;
  verse: number | null | undefined;
  translation: ScriptureTranslationCode;
}): string | null {
  const usfm = bookNameToUsfm(input.book);
  if (
    !usfm ||
    !Number.isInteger(input.chapter) ||
    input.chapter! < 1 ||
    !Number.isInteger(input.verse) ||
    input.verse! < 1
  ) {
    return null;
  }
  const versionId =
    YV_VERSION_BY_TRANSLATION[input.translation] ??
    YV_VERSION_BY_TRANSLATION.KJV;
  return `https://www.bible.com/bible/${versionId}/${usfm}.${input.chapter}.${input.verse}`;
}

/** BibleGateway passage search URL. */
export function buildBibleGatewayPassageUrl(input: {
  reference: string;
  translation: ScriptureTranslationCode;
}): string {
  const q = encodeURIComponent(input.reference.trim());
  return `https://www.biblegateway.com/passage/?search=${q}&version=${input.translation}`;
}
