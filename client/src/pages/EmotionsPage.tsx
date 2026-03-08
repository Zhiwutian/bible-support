import { CSSProperties, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/app/toast-context';
import { Button, Card, EmptyState, SectionHeader } from '@/components/ui';
import { EmotionTile, readEmotions } from '@/features/emotions/emotion-api';
import {
  emotionColorMap,
  getEmotionTheme,
} from '@/features/emotions/emotion-theme';

/** Return persistent translucent tile color style for a given emotion. */
function getEmotionTileStyle(slug: string): CSSProperties {
  const baseColor = emotionColorMap[slug] ?? emotionColorMap.default;
  return {
    backgroundColor: `${baseColor}33`,
    borderColor: `${baseColor}66`,
  };
}

/**
 * Render emotion selection tiles on the home route.
 */
export function EmotionsPage() {
  const { showToast } = useToast();
  const [emotions, setEmotions] = useState<EmotionTile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    async function loadEmotions() {
      setIsLoading(true);
      setError('');
      try {
        const emotionRows = await readEmotions();
        if (isCancelled) return;
        setEmotions(emotionRows);
      } catch (err) {
        if (isCancelled) return;
        const message = err instanceof Error ? err.message : 'Unexpected error';
        setError(message);
        showToast({
          title: 'Could not load emotions',
          description: message,
          variant: 'error',
        });
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadEmotions();
    return () => {
      isCancelled = true;
    };
  }, [showToast]);

  async function handleRetry() {
    setIsLoading(true);
    setError('');
    try {
      setEmotions(await readEmotions());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
      showToast({
        title: 'Could not load emotions',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <SectionHeader
        title="How Are You Feeling Today?"
        description="Choose an emotion to read scripture passages tailored to that feeling."
      />

      {isLoading && (
        <p className="text-sm text-slate-600">Loading emotions...</p>
      )}
      {!isLoading && error && (
        <EmptyState
          title="Could not load emotions"
          description={error}
          actions={
            <Button variant="ghost" onClick={handleRetry}>
              Retry
            </Button>
          }
        />
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {emotions.map((emotion) => (
            <Link key={emotion.emotionId} to={`/emotions/${emotion.slug}`}>
              <Card
                style={getEmotionTileStyle(emotion.slug)}
                className={`h-full border p-4 transition ${getEmotionTheme(emotion.slug).cardClassName}`}>
                <h2 className="text-lg font-semibold text-slate-800">
                  {emotion.name}
                </h2>
                {emotion.description && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    {emotion.description}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
