import { Button } from '@/components/ui';

type ReaderChapterNavigationProps = {
  hasPrevious: boolean;
  hasNext: boolean;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
};

/**
 * Reader chapter navigation controls.
 */
export function ReaderChapterNavigation({
  hasPrevious,
  hasNext,
  onPreviousChapter,
  onNextChapter,
}: ReaderChapterNavigationProps) {
  return (
    <div className="flex justify-between gap-2">
      <Button
        variant="ghost"
        className="min-h-11"
        disabled={!hasPrevious}
        onClick={onPreviousChapter}>
        ← Previous chapter
      </Button>
      <Button
        variant="ghost"
        className="min-h-11"
        disabled={!hasNext}
        onClick={onNextChapter}>
        Next chapter →
      </Button>
    </div>
  );
}
