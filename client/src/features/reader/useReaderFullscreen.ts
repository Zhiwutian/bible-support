import type { RefObject } from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export type ReaderFullscreenMode = 'native' | 'overlay';

type UseReaderFullscreenOptions = {
  onEnterMode?: (mode: ReaderFullscreenMode) => void;
  onExit?: () => void;
};

/**
 * Fullscreen API when supported, with body scroll lock; overlay fallback is implicit (same fixed shell).
 * Exiting native fullscreen via the browser (e.g. Esc) ends the immersive session.
 */
export function useReaderFullscreen(options: UseReaderFullscreenOptions = {}): {
  containerRef: RefObject<HTMLDivElement | null>;
  isActive: boolean;
  enter: () => void;
  exit: () => void;
} {
  const { onEnterMode, onExit } = options;
  const onEnterModeRef = useRef(onEnterMode);
  const onExitRef = useRef(onExit);

  useEffect(() => {
    onEnterModeRef.current = onEnterMode;
    onExitRef.current = onExit;
  }, [onEnterMode, onExit]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const hadNativeFsRef = useRef(false);
  const isActiveRef = useRef(false);

  const syncInactive = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);
  }, []);

  const exit = useCallback(() => {
    hadNativeFsRef.current = false;
    isActiveRef.current = false;
    setIsActive(false);
    const el = containerRef.current;
    if (document.fullscreenElement && el && document.fullscreenElement === el) {
      void document.exitFullscreen().catch(() => {});
    }
    document.body.style.overflow = '';
    onExitRef.current?.();
  }, []);

  const enter = useCallback(() => {
    isActiveRef.current = true;
    setIsActive(true);
  }, []);

  useLayoutEffect(() => {
    if (!isActive) return;
    const el = containerRef.current;
    if (!el) return;
    document.body.style.overflow = 'hidden';
    let cancelled = false;

    const tryNative = async () => {
      if (!el.requestFullscreen) {
        if (!cancelled) onEnterModeRef.current?.('overlay');
        return;
      }
      try {
        await el.requestFullscreen();
        if (!cancelled) {
          hadNativeFsRef.current = true;
          onEnterModeRef.current?.('native');
        }
      } catch {
        hadNativeFsRef.current = false;
        if (!cancelled) onEnterModeRef.current?.('overlay');
      }
    };
    void tryNative();

    return () => {
      cancelled = true;
    };
  }, [isActive]);

  useEffect(() => {
    function onFullscreenChange() {
      const el = containerRef.current;
      if (document.fullscreenElement === el) return;
      if (hadNativeFsRef.current && document.fullscreenElement === null) {
        hadNativeFsRef.current = false;
        if (isActiveRef.current) {
          syncInactive();
          document.body.style.overflow = '';
          onExitRef.current?.();
        }
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [syncInactive]);

  useEffect(() => {
    const ref = containerRef;
    return () => {
      document.body.style.overflow = '';
      const el = ref.current;
      if (el && document.fullscreenElement === el) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  return { containerRef, isActive, enter, exit };
}
