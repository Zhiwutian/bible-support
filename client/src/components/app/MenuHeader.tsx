import { BrandLockup } from './BrandLockup';

type MenuHeaderProps = {
  onClose: () => void;
};

/** Render the sticky header row used in the overlay menu. */
export function MenuHeader({ onClose }: MenuHeaderProps) {
  return (
    <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-white pb-2">
      <BrandLockup context="menu" />
      <button
        type="button"
        className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        onClick={onClose}>
        Close
      </button>
    </div>
  );
}
