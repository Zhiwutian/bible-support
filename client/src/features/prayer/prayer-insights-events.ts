/** Dispatched after a list prayer session is logged so hub pages can refresh streak data. */
export const PRAYER_INSIGHTS_INVALIDATE_EVENT =
  'app:prayer-insights-invalidate';

export function dispatchPrayerInsightsInvalidate(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PRAYER_INSIGHTS_INVALIDATE_EVENT));
}
