import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib';

const DEFAULT_TUTORIAL_FALLBACK = '/tutorial/reader-comfort-placeholder.svg';

type Props = {
  /** Public URL e.g. `/tutorial/screenshot.webp` */
  src: string;
  /** Required for accessibility */
  alt: string;
  /** Shown if `src` is missing (404); defaults to SVG placeholder */
  fallbackSrc?: string;
  caption?: ReactNode;
  /** Optional aspect ratio wrapper e.g. `aspect-video` to limit CLS */
  aspectClassName?: string;
  className?: string;
};

export function TutorialFigure({
  src,
  alt,
  fallbackSrc = DEFAULT_TUTORIAL_FALLBACK,
  caption,
  aspectClassName = 'aspect-video',
  className,
}: Props) {
  const [activeSrc, setActiveSrc] = useState(src);

  useEffect(() => {
    setActiveSrc(src);
  }, [src]);

  return (
    <figure
      className={cn(
        'overflow-hidden rounded-lg border border-slate-200 bg-slate-50',
        className,
      )}>
      <div className={cn('relative w-full bg-slate-100', aspectClassName)}>
        <img
          src={activeSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-contain object-center"
          onError={() => {
            if (activeSrc !== fallbackSrc) setActiveSrc(fallbackSrc);
          }}
        />
      </div>
      {caption ? (
        <figcaption className="border-t border-slate-200 px-3 py-2 text-xs text-slate-600">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
