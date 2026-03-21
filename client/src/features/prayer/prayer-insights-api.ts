import type {
  PrayerInsightsResponse,
  UpdatePrayerReminderSettingsRequest,
} from '@shared/prayer-contracts';
import { fetchJson } from '@/lib';

export async function readPrayerInsights(): Promise<PrayerInsightsResponse> {
  return fetchJson<PrayerInsightsResponse>('/api/prayer/insights');
}

export async function patchPrayerReminderSettings(
  body: UpdatePrayerReminderSettingsRequest,
): Promise<PrayerInsightsResponse> {
  return fetchJson<PrayerInsightsResponse>('/api/prayer/settings', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
