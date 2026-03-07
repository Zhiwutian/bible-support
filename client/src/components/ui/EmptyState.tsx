import { ReactNode } from 'react';
import { Card } from './Card';

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

/**
 * Reusable empty-state layout for list and table views.
 */
export function EmptyState({ title, description, actions }: Props) {
  return (
    <Card className="border-dashed p-6 text-center">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      )}
      {actions && <div className="mt-4">{actions}</div>}
    </Card>
  );
}
