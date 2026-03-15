import { Button } from './Button';
import { ModalShell } from './ModalShell';

export type SettingHelpContent = {
  title: string;
  description: string;
};

type Props = {
  help: SettingHelpContent | null;
  onClose: () => void;
  titleId: string;
};

/** Render a reusable setting-help modal for inline '?' triggers. */
export function SettingHelpModal({ help, onClose, titleId }: Props) {
  if (!help) return null;
  return (
    <ModalShell
      title={help.title}
      titleId={titleId}
      panelClassName="max-w-sm"
      onClose={onClose}>
      <p className="mt-2 text-sm text-slate-700">{help.description}</p>
      <div className="mt-4 flex justify-end">
        <Button variant="primary" className="min-h-10" onClick={onClose}>
          Close
        </Button>
      </div>
    </ModalShell>
  );
}
