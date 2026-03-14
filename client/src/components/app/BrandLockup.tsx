type BrandLockupContext = 'menu' | 'header' | 'modal';

type BrandLockupProps = {
  context: BrandLockupContext;
};

const brandLockupByContext: Record<
  BrandLockupContext,
  {
    containerClassName: string;
    logoClassName: string;
    titleClassName: string;
  }
> = {
  menu: {
    containerClassName: 'inline-flex flex-col items-start gap-2',
    logoClassName:
      'h-16 w-16 shrink-0 rounded-sm sm:h-24 sm:w-24 lg:h-28 lg:w-28',
    titleClassName: 'app-brand-title app-brand-title-menu text-slate-900',
  },
  header: {
    containerClassName:
      'inline-flex flex-col items-start gap-2 pr-1 sm:flex-row sm:items-center sm:gap-3',
    logoClassName:
      'h-16 w-16 shrink-0 rounded-sm sm:h-24 sm:w-24 lg:h-28 lg:w-28',
    titleClassName: 'app-brand-title app-brand-title-header text-slate-800',
  },
  modal: {
    containerClassName: 'inline-flex items-center gap-2',
    logoClassName: 'size-12 shrink-0 rounded-sm',
    titleClassName: 'app-brand-title app-brand-title-modal text-slate-900',
  },
};

/** Render the app brand lockup for shell and auth surfaces. */
export function BrandLockup({ context }: BrandLockupProps) {
  const config = brandLockupByContext[context];
  return (
    <div className={config.containerClassName}>
      <img
        src="/logo-glow-bible.svg"
        alt="Scripture and Solace logo"
        className={config.logoClassName}
      />
      <span className={config.titleClassName}>Scripture &amp; Solace</span>
    </div>
  );
}
