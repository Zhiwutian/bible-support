/**
 * Shared UI copy tokens for high-reuse helper/action/error phrases.
 * Keep this lightweight so route-level copy can still stay contextual.
 *
 * Canonical source:
 * - docs/styleguide/frontend-patterns.md -> "Copy Freeze (Canonical Phrases)"
 */
export const appCopy = {
  actions: {
    retry: 'Try again',
    dismiss: 'Dismiss',
    openReader: 'Open Reader',
    openSearch: 'Open Search',
    goToSupport: 'Go to Support',
    copyLink: 'Copy Link',
    shareVerse: 'Share Verse',
  },
  loading: {
    generic: 'Loading...',
    verses: 'Loading verses...',
    savedBooks: 'Loading your saved books...',
    emotions: 'Loading support categories...',
    context: 'Loading context...',
  },
  empty: {
    noResultsYet: 'No results yet',
    noVersesFound: 'No verses found yet',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    couldNotLoad: 'We could not load that right now.',
    shareUnavailable: 'Sharing is unavailable on this device.',
    couldNotShareVerse: 'We could not share this verse right now.',
    copyFailed: 'We could not copy that right now.',
  },
  status: {
    openedShareOptions: 'Share options are open.',
    copiedShareLink: 'Share link copied.',
    shareCanceled: 'Share canceled.',
  },
} as const;
