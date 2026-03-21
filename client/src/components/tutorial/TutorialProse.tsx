import type { ReactNode } from 'react';
import { cn } from '@/lib';

type Props = {
  children: ReactNode;
  className?: string;
};

/** Max-width reading column for tutorial MDX content. */
export function TutorialProse({ children, className }: Props) {
  return (
    <div
      className={cn(
        'tutorial-prose mx-auto max-w-3xl space-y-6 text-slate-800',
        '[&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900',
        '[&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900',
        '[&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-700',
        '[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-sm [&_ul]:text-slate-700',
        '[&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ol]:text-sm [&_ol]:text-slate-700',
        '[&_a]:font-semibold [&_a]:text-indigo-700 [&_a]:underline-offset-2 hover:[&_a]:text-indigo-600',
        className,
      )}>
      {children}
    </div>
  );
}
