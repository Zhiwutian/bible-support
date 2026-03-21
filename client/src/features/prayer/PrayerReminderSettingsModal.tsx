import type {
  PrayerInsightsResponse,
  UpdatePrayerReminderSettingsRequest,
} from '@shared/prayer-contracts';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/app/toast-context';
import { Button, Input, ModalShell } from '@/components/ui';
import { patchPrayerReminderSettings } from '@/features/prayer/prayer-insights-api';
import { trackEvent } from '@/lib/telemetry';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toTimeValue(hour: number | null, minute: number | null): string {
  const h = hour ?? 8;
  const m = minute ?? 0;
  return `${pad2(h)}:${pad2(m)}`;
}

function parseTimeValue(raw: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

type Props = {
  open: boolean;
  insights: PrayerInsightsResponse | null;
  onClose: () => void;
  onSaved: (next: PrayerInsightsResponse) => void;
};

export function PrayerReminderSettingsModal({
  open,
  insights,
  onClose,
  onSaved,
}: Props) {
  const { showToast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [timeValue, setTimeValue] = useState('08:00');
  const [timezone, setTimezone] = useState('UTC');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || !insights) return;
    const r = insights.reminder;
    setEnabled(r.enabled);
    setTimeValue(toTimeValue(r.hour, r.minute));
    setTimezone(
      r.timezone ??
        (typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : 'UTC'),
    );
  }, [open, insights]);

  async function onSave() {
    const parsed = parseTimeValue(timeValue);
    if (!parsed) {
      showToast({
        title: 'Invalid time',
        description: 'Use a 24-hour time like 08:30.',
        variant: 'error',
      });
      return;
    }
    setIsSaving(true);
    try {
      const body: UpdatePrayerReminderSettingsRequest = {
        reminderEnabled: enabled,
        reminderHour: parsed.hour,
        reminderMinute: parsed.minute,
        reminderTimezone: timezone.trim() || 'UTC',
      };
      const next = await patchPrayerReminderSettings(body);
      onSaved(next);
      trackEvent('prayer_reminder_settings_saved', {
        enabled: body.reminderEnabled ?? false,
      });
      if (enabled && typeof Notification !== 'undefined') {
        if (Notification.permission === 'default') {
          void Notification.requestPermission();
        }
      }
      showToast({
        title: 'Prayer reminder updated',
        variant: 'success',
      });
      onClose();
    } catch (err) {
      showToast({
        title: 'Could not save reminder',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) return null;

  return (
    <ModalShell
      title="Prayer reminder"
      titleId="prayer-reminder-modal-title"
      onClose={onClose}
      panelClassName="max-h-[85vh] max-w-md overflow-y-auto">
      <p className="mt-2 text-sm text-slate-600">
        We&apos;ll nudge you while this app is open at the time below (in your
        chosen timezone). For browser notifications, allow prompts when you
        enable reminders.
      </p>
      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <Input
            type="checkbox"
            className="size-5"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Enable daily reminder
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Local time
          <Input
            type="time"
            className="mt-1 min-h-11"
            value={timeValue}
            onChange={(event) => setTimeValue(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          IANA timezone
          <Input
            className="mt-1 min-h-11 font-mono text-sm"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            placeholder="America/Chicago"
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">
            Usually matches your device (
            {typeof Intl !== 'undefined'
              ? Intl.DateTimeFormat().resolvedOptions().timeZone
              : '…'}
            ).
          </span>
        </label>
      </div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-full sm:w-auto"
          onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          className="min-h-11 w-full sm:w-auto"
          disabled={isSaving}
          onClick={() => void onSave()}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </ModalShell>
  );
}
