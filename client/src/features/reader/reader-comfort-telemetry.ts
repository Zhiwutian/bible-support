/**
 * Reader comfort rollout telemetry — privacy expectations for Phase 4 gates.
 * @see docs/plans/reader-comfort-phase-3-4.md
 */

export const READER_COMFORT_ROLLOUT_EVENTS = [
  'reader_preference_changed',
  'reader_preferences_reset',
  'reader_break_tip_dismissed',
] as const;

export type ReaderComfortRolloutEvent =
  (typeof READER_COMFORT_ROLLOUT_EVENTS)[number];

function isReaderComfortRolloutEvent(
  name: string,
): name is ReaderComfortRolloutEvent {
  return (READER_COMFORT_ROLLOUT_EVENTS as readonly string[]).includes(name);
}

/**
 * Returns true if the event is not one of the three rollout events, or if the
 * payload matches the documented privacy-safe shape (no nested objects, no
 * arbitrary strings beyond preference keys/values).
 */
export function isPrivacySafeReaderComfortRolloutPayload(
  name: string,
  payload: Record<string, unknown> | undefined,
): boolean {
  if (!isReaderComfortRolloutEvent(name)) return true;

  if (
    name === 'reader_preferences_reset' ||
    name === 'reader_break_tip_dismissed'
  ) {
    return payload === undefined || Object.keys(payload).length === 0;
  }

  if (name === 'reader_preference_changed') {
    if (!payload || typeof payload !== 'object') return false;
    const keys = Object.keys(payload);
    if (keys.length !== 2 || !keys.includes('key') || !keys.includes('value')) {
      return false;
    }
    const key = payload.key;
    const value = payload.value;
    if (typeof key !== 'string' || key.length === 0) return false;
    if (typeof value === 'boolean') return true;
    if (typeof value === 'string') return true;
    return false;
  }

  return true;
}
