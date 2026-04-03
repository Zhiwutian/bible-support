import { z } from 'zod';
import type { ScriptureTranslationCode } from '@shared/scripture-search-contracts';
import { SUPPORTED_SCRIPTURE_TRANSLATIONS } from '@shared/scripture-search-contracts';

export const PREFERRED_TRANSLATION_STORAGE_KEY = 'app:preferred-translation:v1';

function isSupported(value: string): value is ScriptureTranslationCode {
  return SUPPORTED_SCRIPTURE_TRANSLATIONS.includes(
    value as ScriptureTranslationCode,
  );
}

const storedSchema = z.object({
  v: z.literal(1),
  translation: z.custom<ScriptureTranslationCode>(
    (val): val is ScriptureTranslationCode =>
      typeof val === 'string' && isSupported(val),
  ),
});

export function loadPreferredTranslation(): ScriptureTranslationCode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PREFERRED_TRANSLATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = storedSchema.safeParse(JSON.parse(raw) as unknown);
    if (!parsed.success) {
      window.localStorage.removeItem(PREFERRED_TRANSLATION_STORAGE_KEY);
      return null;
    }
    return parsed.data.translation;
  } catch {
    try {
      window.localStorage.removeItem(PREFERRED_TRANSLATION_STORAGE_KEY);
    } catch {
      // ignore
    }
    return null;
  }
}

export function savePreferredTranslation(
  translation: ScriptureTranslationCode,
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = storedSchema.parse({ v: 1, translation });
    window.localStorage.setItem(
      PREFERRED_TRANSLATION_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // ignore
  }
}

/**
 * If the user has never stored a preference, seed from a valid `translation` query on `/reader`.
 * Call synchronously before reading preference during reader initial state.
 */
export function seedPreferredTranslationFromReaderUrlIfNeeded(
  searchParams: URLSearchParams,
): void {
  if (typeof window === 'undefined') return;
  if (loadPreferredTranslation() !== null) return;
  const urlTrans = searchParams.get('translation')?.toUpperCase() ?? '';
  if (isSupported(urlTrans)) {
    savePreferredTranslation(urlTrans);
  }
}
