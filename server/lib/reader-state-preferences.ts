import { z } from 'zod';
import { READER_READING_STYLES } from '@shared/scripture-search-contracts.js';
import type { ReaderPreferencesPayload } from '@shared/scripture-search-contracts.js';

const readerThemeSchema = z.enum(['light', 'sepia', 'dark']);
const readerFontFamilySchema = z.enum(['serif', 'sans']);
const readerFontSizeSchema = z.enum(['xs', 'sm', 'md', 'lg', 'xl']);
const readerLineHeightSchema = z.enum(['normal', 'relaxed', 'loose']);
const readerParagraphSpacingSchema = z.enum(['tight', 'normal', 'loose']);
const readerContentWidthSchema = z.enum(['narrow', 'balanced', 'wide']);

/** Canonical reader-preferences schema shared by controller/service layers. */
export const readerPreferencesSchema = z.object({
  theme: readerThemeSchema,
  fontFamily: readerFontFamilySchema,
  fontSize: readerFontSizeSchema,
  lineHeight: readerLineHeightSchema,
  paragraphSpacing: readerParagraphSpacingSchema,
  contentWidth: readerContentWidthSchema,
  reducedMotion: z.boolean(),
  breakReminder: z.boolean(),
  readingStyle: z.enum(READER_READING_STYLES),
  hideTranslationIndicators: z.boolean(),
});

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Normalize potentially legacy/untrusted preferences into a canonical payload.
 */
export function normalizeReaderPreferences(
  value: unknown,
): ReaderPreferencesPayload | null {
  if (!isObjectRecord(value)) return null;
  const candidate = {
    ...value,
    readingStyle:
      value.readingStyle === 'standard' || value.readingStyle === 'clean'
        ? value.readingStyle
        : 'verse',
    hideTranslationIndicators:
      typeof value.hideTranslationIndicators === 'boolean'
        ? value.hideTranslationIndicators
        : false,
  };
  const parsed = readerPreferencesSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}
