import { ReactNode } from 'react';
import { cn } from '@/lib';

type Props = {
  title: string;
  description?: string;
  metadata?: ReactNode;
  className?: string;
};

/**
 * Shared section heading with optional description and metadata row.
 */
export function SectionHeader({
  title,
  description,
  metadata,
  className,
}: Props) {
  return (
    <header className={cn('mb-6', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {metadata}
      </div>
      {description && (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      )}
    </header>
  );
}
