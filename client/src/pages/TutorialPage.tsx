import { SectionHeader } from '@/components/ui';
import TutorialGettingStarted from '@/content/tutorial/sections/01-getting-started.mdx';
import TutorialSupport from '@/content/tutorial/sections/02-support.mdx';
import TutorialSearch from '@/content/tutorial/sections/03-search.mdx';
import TutorialSaved from '@/content/tutorial/sections/04-saved.mdx';
import TutorialReader from '@/content/tutorial/sections/05-reader.mdx';
import TutorialWrapUp from '@/content/tutorial/sections/06-wrap-up.mdx';

/** Provide guided route-by-route usage instructions for the app (MDX sections). */
export function TutorialPage() {
  return (
    <>
      <SectionHeader
        title="Tutorial"
        description="A step-by-step guide to get help quickly, save verses, and return to what matters."
      />
      <div className="space-y-10">
        <TutorialGettingStarted />
        <TutorialSupport />
        <TutorialSearch />
        <TutorialSaved />
        <TutorialReader />
        <TutorialWrapUp />
      </div>
    </>
  );
}
