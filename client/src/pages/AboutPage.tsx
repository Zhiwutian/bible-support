import { SectionHeader } from '@/components/ui';

/**
 * Render a simple About page to demonstrate route-level screens.
 */
export function AboutPage() {
  return (
    <>
      <SectionHeader
        title="About This Website"
        description="This app helps you explore biblical passages by emotion, with a calm reading experience designed for reflection and encouragement."
      />
      <p className="mb-3 text-base leading-relaxed text-slate-700">
        On the home page, you can choose from eight common emotions. Each
        emotion opens a scripture view with passages chosen for that feeling.
      </p>
      <p className="text-base leading-relaxed text-slate-700">
        You can move through verses with arrow buttons on desktop or swipe
        gestures on mobile. Navigation loops continuously, so reaching the end
        returns you to the first scripture.
      </p>
    </>
  );
}
