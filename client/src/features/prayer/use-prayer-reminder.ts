import { useEffect, useRef } from 'react';
import type { PrayerInsightsResponse } from '@shared/prayer-contracts';
import { useToast } from '@/components/app/toast-context';

const STORAGE_PREFIX = 'prayer-reminder-fired';

function dateInTimeZone(timeZone: string, d = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  if (!year || !month || !day) {
    return new Date(d).toISOString().slice(0, 10);
  }
  return `${year}-${month}-${day}`;
}

function clockInTimeZone(
  timeZone: string,
  d = new Date(),
): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value);
  return { hour, minute };
}

/**
 * When the app is open, show a toast (and optional browser notification) at the
 * user's saved local time. Fires at most once per local calendar day per slot.
 */
export function usePrayerReminder(insights: PrayerInsightsResponse | null) {
  const { showToast } = useToast();
  const lastSlotKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!insights?.reminder.enabled) return;
    const timeZone = insights.reminder.timezone;
    const targetH = insights.reminder.hour;
    const targetM = insights.reminder.minute;
    if (timeZone == null || targetH == null || targetM == null) return;
    const scheduleTz: string = timeZone;
    const scheduleH = targetH;
    const scheduleM = targetM;

    function tick() {
      const { hour, minute } = clockInTimeZone(scheduleTz);
      if (hour !== scheduleH || minute !== scheduleM) return;

      const dateKey = dateInTimeZone(scheduleTz);
      const slotKey = `${STORAGE_PREFIX}:${dateKey}:${scheduleH}:${scheduleM}`;
      if (lastSlotKeyRef.current === slotKey) return;
      if (typeof sessionStorage !== 'undefined') {
        if (sessionStorage.getItem(slotKey) === '1') {
          lastSlotKeyRef.current = slotKey;
          return;
        }
        sessionStorage.setItem(slotKey, '1');
      }
      lastSlotKeyRef.current = slotKey;

      showToast({
        title: 'Prayer reminder',
        description:
          'Take a moment to pray for your lists and partners. Open Prayer Lists when you are ready.',
        variant: 'success',
      });

      try {
        if (
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted'
        ) {
          const n = new Notification('Prayer reminder', {
            body: 'Take a moment to pray for your lists and partners.',
          });
          void n;
        }
      } catch {
        /* ignore notification failures */
      }
    }

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [insights, showToast]);
}
