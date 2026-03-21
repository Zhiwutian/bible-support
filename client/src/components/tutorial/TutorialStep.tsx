import type { ReactNode } from 'react';
import { Card } from '@/components/ui';
import { cn } from '@/lib';

type Props = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function TutorialStep({ title, children, className }: Props) {
  return (
    <Card className={cn('space-y-2 border p-4', className)}>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <div className="text-sm leading-relaxed text-slate-700">{children}</div>
    </Card>
  );
}
