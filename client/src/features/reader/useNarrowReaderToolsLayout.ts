import { useEffect, useState } from 'react';

const NARROW_TOOLS_MEDIA_QUERY = '(max-width: 767px)';

/**
 * When true, reader tools surface uses a bottom-sheet layout; when false, centered modal (md+).
 * Defaults to false if `matchMedia` is unavailable.
 */
export function useNarrowReaderToolsLayout(): boolean {
  const [matches, setMatches] = useState(() => initialMatches());

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(NARROW_TOOLS_MEDIA_QUERY);
    const onChange = () => setMatches(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return matches;
}

function initialMatches(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia(NARROW_TOOLS_MEDIA_QUERY).matches;
}
