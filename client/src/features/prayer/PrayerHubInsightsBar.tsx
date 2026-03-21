import type { PrayerInsightsResponse } from '@shared/prayer-contracts';
import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { PrayerReminderSettingsModal } from '@/features/prayer/PrayerReminderSettingsModal';

type Props = {
  insights: PrayerInsightsResponse | null;
  isLoading: boolean;
  /** Set when the insights API failed (streak/reminder summary unavailable). */
  loadError?: string | null;
  onInsightsUpdated: (next: PrayerInsightsResponse) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
};

export function PrayerHubInsightsBar({
  insights,
  isLoading,
  loadError = null,
  onInsightsUpdated,
  onOpenFilters,
  activeFilterCount,
}: Props) {
  const [reminderOpen, setReminderOpen] = useState(false);

  return (
    <>
      <Card className="mb-4 border p-4 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-slate-800">
              Streaks &amp; reminders
            </p>
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading insights…</p>
            ) : loadError ? (
              <p className="text-sm text-slate-600" role="status">
                Couldn&apos;t load streaks or reminder settings. You can still
                use filters and your roster; try refreshing the page.
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">
                  {insights?.streak.currentDays ?? 0}-day streak
                </span>
                {' · '}
                Best {insights?.streak.longestDays ?? 0}
                {insights?.streak.lastPrayedDate
                  ? ` · Last list prayer (UTC day) ${insights.streak.lastPrayedDate}`
                  : ''}
              </p>
            )}
            <p className="text-xs text-slate-500">
              Streaks use UTC days from prayer list sessions. Reminders fire
              while the app is open.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full justify-center sm:w-auto"
              onClick={onOpenFilters}>
              Filters
              {activeFilterCount > 0 ? (
                <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-900">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
            <Button
              type="button"
              variant="primary"
              className="min-h-11 w-full justify-center sm:w-auto"
              onClick={() => setReminderOpen(true)}>
              Reminder
            </Button>
          </div>
        </div>
      </Card>
      <PrayerReminderSettingsModal
        open={reminderOpen}
        insights={insights}
        onClose={() => setReminderOpen(false)}
        onSaved={onInsightsUpdated}
      />
    </>
  );
}
