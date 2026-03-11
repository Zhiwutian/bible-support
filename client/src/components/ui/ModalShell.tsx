import { ReactNode } from 'react';
import { cn } from '@/lib';

type Props = {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  panelClassName?: string;
  titleId?: string;
};

/** Shared modal shell with backdrop and centered panel. */
export function ModalShell({
  title,
  children,
  onClose,
  className,
  panelClassName,
  titleId = 'modal-shell-title',
}: Props) {
  return (
    <div
      className={cn('ui-modal-backdrop', className)}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}>
      <section
        className={cn('ui-modal-panel', panelClassName)}
        onClick={(event) => event.stopPropagation()}>
        <h2 id={titleId} className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        {children}
      </section>
    </div>
  );
}
