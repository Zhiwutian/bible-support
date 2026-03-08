import { useEffect, useMemo, useState } from 'react';
import {
  EmotionTile,
  readEmotionScriptures,
  ScriptureQuote,
} from './emotion-api';

type HookState = {
  emotion: EmotionTile | null;
  scriptures: ScriptureQuote[];
  currentIndex: number;
  isLoading: boolean;
  error: string;
};

/**
 * Load emotion scriptures and manage current quote navigation state.
 */
export function useEmotionScriptures(slug: string | undefined): HookState & {
  goNext: () => void;
  goPrevious: () => void;
} {
  const [emotion, setEmotion] = useState<EmotionTile | null>(null);
  const [scriptures, setScriptures] = useState<ScriptureQuote[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    if (!slug) {
      if (!isCancelled) {
        setIsLoading(false);
        setError('emotion not found');
      }
      return;
    }
    const emotionSlug = slug;

    async function loadEmotionData() {
      setIsLoading(true);
      setError('');
      try {
        const orderedPayload = await readEmotionScriptures(emotionSlug);

        if (isCancelled) return;
        setEmotion(orderedPayload.emotion);
        setScriptures(orderedPayload.scriptures);
        const totalScriptures = orderedPayload.scriptures.length;
        const randomIndex =
          totalScriptures > 0 ? Math.floor(Math.random() * totalScriptures) : 0;
        setCurrentIndex(randomIndex);
      } catch (err) {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadEmotionData();
    return () => {
      isCancelled = true;
    };
  }, [slug]);

  const totalScriptures = scriptures.length;
  function goNext() {
    if (totalScriptures === 0) return;
    setCurrentIndex((current) => (current + 1) % totalScriptures);
  }

  function goPrevious() {
    if (totalScriptures === 0) return;
    setCurrentIndex(
      (current) => (current - 1 + totalScriptures) % totalScriptures,
    );
  }

  const safeIndex = useMemo(() => {
    if (scriptures.length === 0) return 0;
    return Math.min(Math.max(currentIndex, 0), scriptures.length - 1);
  }, [currentIndex, scriptures.length]);

  return {
    emotion,
    scriptures,
    currentIndex: safeIndex,
    isLoading,
    error,
    goNext,
    goPrevious,
  };
}
