/**
 * Validate IANA time zone identifiers for user-facing settings (e.g. prayer reminders).
 * Uses `Intl.supportedValuesOf` when available (Node 22+); falls back to a conservative pattern.
 *
 * Note: Node's `supportedValuesOf('timeZone')` may omit short ids like `UTC`; those are allowed explicitly.
 */
const CANONICAL_TIME_ZONE_ALIASES: ReadonlySet<string> = new Set([
  'UTC',
  'GMT',
  'Etc/UTC',
  'Etc/GMT',
]);

let supportedTimeZoneSet: ReadonlySet<string> | null | undefined;

function loadSupportedTimeZones(): ReadonlySet<string> | null {
  if (supportedTimeZoneSet !== undefined) {
    return supportedTimeZoneSet;
  }
  try {
    const list = Intl.supportedValuesOf('timeZone');
    supportedTimeZoneSet = new Set(list);
    return supportedTimeZoneSet;
  } catch {
    supportedTimeZoneSet = null;
    return null;
  }
}

const FALLBACK_TIMEZONE_PATTERN = /^[-A-Za-z0-9_+/]+$/;

/**
 * Return true when `id` is a known IANA zone, or matches the fallback pattern when enumeration is unavailable.
 */
export function isValidIanaTimeZoneId(id: string): boolean {
  if (CANONICAL_TIME_ZONE_ALIASES.has(id)) {
    return true;
  }
  const supported = loadSupportedTimeZones();
  if (supported) {
    return supported.has(id);
  }
  return (
    id.length > 0 &&
    id.length <= 64 &&
    FALLBACK_TIMEZONE_PATTERN.test(id) &&
    !/\s/.test(id)
  );
}
