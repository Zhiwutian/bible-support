import type { ReaderReadingStyle } from '@shared/scripture-search-contracts';
import { Button, ModalShell, SettingHelpButton } from '@/components/ui';
import type { ReaderPreferences } from './reader-preferences';

type ReaderHelpContent = {
  title: string;
  description: string;
};

type ReaderOptionsModalProps = {
  isOpen: boolean;
  readerPreferences: ReaderPreferences;
  isReaderAuthenticated: boolean;
  onClose: () => void;
  onResetReaderPreferences: () => void;
  onUpdateReaderPreference: <K extends keyof ReaderPreferences>(
    key: K,
    value: ReaderPreferences[K],
  ) => void;
  onReadingStyleChanged: (nextStyle: ReaderReadingStyle) => void;
  onBreakReminderToggle: (enabled: boolean) => void;
  onOpenHelp: (help: ReaderHelpContent) => void;
  onClearSyncedReaderData: () => Promise<void>;
};

/**
 * Reader options modal extracted as a presentation component.
 */
export function ReaderOptionsModal({
  isOpen,
  readerPreferences,
  isReaderAuthenticated,
  onClose,
  onResetReaderPreferences,
  onUpdateReaderPreference,
  onReadingStyleChanged,
  onBreakReminderToggle,
  onOpenHelp,
  onClearSyncedReaderData,
}: ReaderOptionsModalProps) {
  if (!isOpen) return null;

  return (
    <ModalShell
      title="Reader Options"
      titleId="reader-options-modal-title"
      onClose={onClose}
      panelClassName="max-h-[85vh] max-w-xl overflow-y-auto">
      <div className="sticky top-0 z-10 -mx-1 -mt-1 mb-3 flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-1 pb-2 pt-1">
        <p className="text-base font-semibold text-slate-900">
          Reader settings
        </p>
        <Button
          variant="ghost"
          className="min-h-11"
          onClick={onResetReaderPreferences}>
          Reset reader settings
        </Button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          <span className="flex items-center gap-2">
            Reading style
            <SettingHelpButton
              settingLabel="Reading style"
              onClick={() =>
                onOpenHelp({
                  title: 'Reading style',
                  description:
                    'Verse shows one verse per line. Standard keeps paragraph flow with verse numbers. Clean keeps paragraph flow without verse indicators.',
                })
              }
            />
          </span>
          <select
            aria-label="Reading style"
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
            value={readerPreferences.readingStyle}
            onChange={(event) => {
              onReadingStyleChanged(event.target.value as ReaderReadingStyle);
            }}>
            <option value="verse">Verse</option>
            <option value="standard">Standard</option>
            <option value="clean">Clean</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          <span className="flex items-center gap-2">
            Theme
            <SettingHelpButton
              settingLabel="Theme"
              onClick={() =>
                onOpenHelp({
                  title: 'Theme',
                  description:
                    'Choose chapter colors (Light, Sepia, or Dark). Same as Menu → Display settings → Reading colors. Separate from app-level dark mode.',
                })
              }
            />
          </span>
          <select
            aria-label="Theme"
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
            value={readerPreferences.theme}
            onChange={(event) =>
              onUpdateReaderPreference(
                'theme',
                event.target.value as ReaderPreferences['theme'],
              )
            }>
            <option value="light">Light</option>
            <option value="sepia">Sepia</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          <span className="flex items-center gap-2">
            Font family
            <SettingHelpButton
              settingLabel="Font family"
              onClick={() =>
                onOpenHelp({
                  title: 'Font family',
                  description: 'Choose serif or sans-serif for chapter text.',
                })
              }
            />
          </span>
          <select
            aria-label="Font family"
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
            value={readerPreferences.fontFamily}
            onChange={(event) =>
              onUpdateReaderPreference(
                'fontFamily',
                event.target.value as ReaderPreferences['fontFamily'],
              )
            }>
            <option value="serif">Serif</option>
            <option value="sans">Sans</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          <span className="flex items-center gap-2">
            Font size
            <SettingHelpButton
              settingLabel="Reader font size"
              onClick={() =>
                onOpenHelp({
                  title: 'Reader font size',
                  description:
                    'Adjust chapter text size in Reader. XL is tuned for low-vision readability.',
                })
              }
            />
          </span>
          <select
            aria-label="Font size"
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
            value={readerPreferences.fontSize}
            onChange={(event) =>
              onUpdateReaderPreference(
                'fontSize',
                event.target.value as ReaderPreferences['fontSize'],
              )
            }>
            <option value="xs">Extra Small</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">Extra Large</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          <span className="flex items-center gap-2">
            Line height
            <SettingHelpButton
              settingLabel="Line height"
              onClick={() =>
                onOpenHelp({
                  title: 'Line height',
                  description:
                    'Adjust vertical spacing between lines to improve reading comfort.',
                })
              }
            />
          </span>
          <select
            aria-label="Line height"
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
            value={readerPreferences.lineHeight}
            onChange={(event) =>
              onUpdateReaderPreference(
                'lineHeight',
                event.target.value as ReaderPreferences['lineHeight'],
              )
            }>
            <option value="normal">Normal</option>
            <option value="relaxed">Relaxed</option>
            <option value="loose">Loose</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          <span className="flex items-center gap-2">
            Paragraph spacing
            <SettingHelpButton
              settingLabel="Paragraph spacing"
              onClick={() =>
                onOpenHelp({
                  title: 'Paragraph spacing',
                  description:
                    'Adjust spacing between verse blocks for easier scanning.',
                })
              }
            />
          </span>
          <select
            aria-label="Paragraph spacing"
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
            value={readerPreferences.paragraphSpacing}
            onChange={(event) =>
              onUpdateReaderPreference(
                'paragraphSpacing',
                event.target.value as ReaderPreferences['paragraphSpacing'],
              )
            }>
            <option value="tight">Tight</option>
            <option value="normal">Normal</option>
            <option value="loose">Loose</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          <span className="flex items-center gap-2">
            Content width
            <SettingHelpButton
              settingLabel="Content width"
              onClick={() =>
                onOpenHelp({
                  title: 'Content width',
                  description:
                    'Adjust line length for comfort. Narrow can feel easier for focused reading.',
                })
              }
            />
          </span>
          <select
            aria-label="Content width"
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2"
            value={readerPreferences.contentWidth}
            onChange={(event) =>
              onUpdateReaderPreference(
                'contentWidth',
                event.target.value as ReaderPreferences['contentWidth'],
              )
            }>
            <option value="narrow">Narrow</option>
            <option value="balanced">Balanced</option>
            <option value="wide">Wide</option>
          </select>
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={readerPreferences.reducedMotion}
            onChange={(event) =>
              onUpdateReaderPreference('reducedMotion', event.target.checked)
            }
          />
          Reduced motion
        </label>
        <SettingHelpButton
          settingLabel="Reduced motion"
          onClick={() =>
            onOpenHelp({
              title: 'Reduced motion',
              description:
                'Reduce animation and transitions in Reader interactions.',
            })
          }
        />
      </div>
      <div
        className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"
        role="note"
        aria-label="Global high contrast hint">
        <p className="font-semibold text-slate-800">Global high contrast</p>
        <p className="mt-1 leading-snug">
          For stronger contrast on menus and controls, enable{' '}
          <span className="font-medium">High contrast</span> under{' '}
          <span className="font-medium">Menu → Display settings</span>. Reader
          theme (Light, Sepia, or Dark) still controls chapter reading colors.
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={readerPreferences.breakReminder}
            onChange={(event) => {
              onBreakReminderToggle(event.target.checked);
            }}
          />
          Gentle break reminders
        </label>
        <SettingHelpButton
          settingLabel="Gentle break reminders"
          onClick={() =>
            onOpenHelp({
              title: 'Gentle break reminders',
              description:
                'Show a gentle 20-20-20 eye comfort reminder while reading.',
            })
          }
        />
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={readerPreferences.hideTranslationIndicators}
            onChange={(event) =>
              onUpdateReaderPreference(
                'hideTranslationIndicators',
                event.target.checked,
              )
            }
          />
          Hide translation indicators
        </label>
        <SettingHelpButton
          settingLabel="Hide translation indicators"
          onClick={() =>
            onOpenHelp({
              title: 'Hide translation indicators',
              description:
                'Hide bracket-style markers while reading. This changes display only, not source text.',
            })
          }
        />
      </div>
      {isReaderAuthenticated && (
        <div className="mt-3">
          <Button
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              void onClearSyncedReaderData();
            }}>
            Clear synced reader data
          </Button>
        </div>
      )}
      <div className="sticky bottom-0 z-10 -mx-1 mt-4 flex justify-end border-t border-slate-200 bg-white px-1 pb-1 pt-2">
        <Button variant="ghost" className="min-h-11" onClick={onClose}>
          Done
        </Button>
      </div>
    </ModalShell>
  );
}
