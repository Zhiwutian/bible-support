import type { PrayerInsightsResponse } from '@shared/prayer-contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/app/toast-context';
import { readPrayerInsights } from '@/features/prayer/prayer-insights-api';

/**
 * Load prayer streak/reminder insights for hub pages; surfaces failures like other feature loads.
 */
export function usePrayerPageInsights(): {
  insights: PrayerInsightsResponse | null;
  insightsLoading: boolean;
  insightsError: string | null;
  setInsights: React.Dispatch<
    React.SetStateAction<PrayerInsightsResponse | null>
  >;
  reloadInsights: () => Promise<void>;
} {
  const { showToast } = useToast();
  const [insights, setInsights] = useState<PrayerInsightsResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const failureToastShownRef = useRef(false);

  const reloadInsights = useCallback(async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const data = await readPrayerInsights();
      setInsights(data);
      failureToastShownRef.current = false;
    } catch (err) {
      setInsights(null);
      const message =
        err instanceof Error ? err.message : 'Could not load prayer insights';
      setInsightsError(message);
      if (!failureToastShownRef.current) {
        failureToastShownRef.current = true;
        showToast({
          title: 'Prayer insights unavailable',
          description: message,
          variant: 'error',
        });
      }
    } finally {
      setInsightsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void reloadInsights();
  }, [reloadInsights]);

  return {
    insights,
    insightsLoading,
    insightsError,
    setInsights,
    reloadInsights,
  };
}
