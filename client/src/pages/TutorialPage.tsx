import { SectionHeader } from '@/components/ui';
import TutorialMdx from '@/content/tutorial/index.mdx';

/** Provide guided route-by-route usage instructions for the app (MDX body). */
export function TutorialPage() {
  return (
    <>
      <SectionHeader
        title="Tutorial"
        description="A step-by-step guide to get help quickly, save verses, and return to what matters."
      />
      <TutorialMdx />
    </>
  );
}
