type Props = {
  settingLabel: string;
  onClick: () => void;
};

/** Small question-mark trigger for setting-specific help text. */
export function SettingHelpButton({ settingLabel, onClick }: Props) {
  return (
    <button
      type="button"
      aria-label="Open setting help"
      title={`Help for ${settingLabel}`}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100"
      onClick={onClick}>
      ?
    </button>
  );
}
