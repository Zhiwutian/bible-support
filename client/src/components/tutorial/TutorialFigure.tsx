import type { ReactNode } from 'react';
import { cn } from '@/lib';

type Props = {
  /** Public URL e.g. `/tutorial/screenshot.webp` */
  src: string;
  /** Required for accessibility */
  alt: string;
  caption?: ReactNode;
  /** Optional aspect ratio wrapper e.g. `aspect-video` to limit CLS */
  aspectClassName?: string;
  className?: string;
};

export function TutorialFigure({
  src,
  alt,
  caption,
  aspectClassName = 'aspect-video',
  className,
}: Props) {
  return (
    <figure
      className={cn(
        'overflow-hidden rounded-lg border border-slate-200 bg-slate-50',
        className,
      )}>
      <div className={cn('relative w-full bg-slate-100', aspectClassName)}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-contain object-center"
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
