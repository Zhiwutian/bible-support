import { z } from 'zod';

const ROUTE_STATE_VERSION = 1 as const;

function routeStorageKey(routePath: string): string {
  return `routeState:v${ROUTE_STATE_VERSION}:${routePath}`;
}

/**
 * Read persisted UI state for a route from sessionStorage (Zod-validated).
 */
export function readRouteState<S extends z.ZodType>(
  routePath: string,
  schema: S,
): z.infer<S> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(routeStorageKey(routePath));
    if (!raw) return null;
    const json: unknown = JSON.parse(raw);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      window.sessionStorage.removeItem(routeStorageKey(routePath));
      return null;
    }
    return parsed.data;
  } catch {
    try {
      window.sessionStorage.removeItem(routeStorageKey(routePath));
    } catch {
      // ignore
    }
    return null;
  }
}

/**
 * Persist route UI state to sessionStorage.
 */
export function writeRouteState(routePath: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      routeStorageKey(routePath),
      JSON.stringify(data),
    );
  } catch {
    // Quota / private mode — ignore.
  }
}

export const searchPageRouteStateSchema = z.object({
  version: z.literal(1),
  mode: z.enum(['guided', 'reference', 'keyword']),
  translation: z.string(),
  book: z.string(),
  chapter: z.union([z.number().int().positive(), z.null()]),
  verseStart: z.union([z.number().int().positive(), z.null()]),
  verseEnd: z.union([z.number().int().positive(), z.null()]),
  queryText: z.string(),
  source: z.enum(['local', 'remote']),
  selectedVerseKeys: z.array(z.string()),
  scrollY: z.number().min(0),
});

export type SearchPageRouteState = z.infer<typeof searchPageRouteStateSchema>;

export const savedIndexRouteStateSchema = z.object({
  version: z.literal(1),
  scrollY: z.number().min(0),
});

export type SavedIndexRouteState = z.infer<typeof savedIndexRouteStateSchema>;

export const prayerPartnersRouteStateSchema = z.object({
  version: z.literal(1),
  includeArchived: z.boolean(),
  needsUpdateOnly: z.boolean(),
  needsUpdateDays: z.string(),
  imageFilter: z.enum(['all', 'has', 'none']),
  notesFilter: z.enum(['all', 'has', 'none']),
  sortBy: z.enum(['recent', 'name', 'oldest']),
  scrollY: z.number().min(0),
});

export type PrayerPartnersRouteState = z.infer<
  typeof prayerPartnersRouteStateSchema
>;

/** Session key for `/saved/:book` (use `encodeURIComponent` for `:book`). */
export function savedBookDetailRoutePath(encodedBook: string): string {
  return `/saved/${encodedBook}`;
}

export const savedBookDetailRouteStateSchema = z.object({
  version: z.literal(1),
  scrollY: z.number().min(0),
});

export type SavedBookDetailRouteState = z.infer<
  typeof savedBookDetailRouteStateSchema
>;

export function prayerPartnerDetailRoutePath(partnerId: string): string {
  return `/prayer-partners/${partnerId}`;
}

export const prayerPartnerDetailRouteStateSchema = z.object({
  version: z.literal(1),
  scrollY: z.number().min(0),
});

export type PrayerPartnerDetailRouteState = z.infer<
  typeof prayerPartnerDetailRouteStateSchema
>;

export function prayerListDetailRoutePath(listId: string): string {
  return `/prayer-lists/${listId}`;
}

export const prayerListDetailRouteStateSchema = z.object({
  version: z.literal(1),
  scrollY: z.number().min(0),
  selectedPartnerId: z.number().int(),
  prayerNote: z.string(),
});

export type PrayerListDetailRouteState = z.infer<
  typeof prayerListDetailRouteStateSchema
>;
