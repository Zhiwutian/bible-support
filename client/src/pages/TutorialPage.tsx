import { SectionHeader } from '@/components/ui';
import TutorialGettingStarted from '@/content/tutorial/sections/01-getting-started.mdx';
import TutorialSupport from '@/content/tutorial/sections/02-support.mdx';
import TutorialLearnContext from '@/content/tutorial/sections/07-learn-context.mdx';
import TutorialSearch from '@/content/tutorial/sections/03-search.mdx';
import TutorialSaved from '@/content/tutorial/sections/04-saved.mdx';
import TutorialReader from '@/content/tutorial/sections/05-reader.mdx';
import TutorialDisplaySettings from '@/content/tutorial/sections/08-display-settings.mdx';
import TutorialPrayerHubs from '@/content/tutorial/sections/09-prayer-hubs.mdx';
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
        <TutorialLearnContext />
        <TutorialSearch />
        <TutorialSaved />
        <TutorialReader />
        <TutorialDisplaySettings />
        <TutorialPrayerHubs />
        <TutorialWrapUp />
      </div>
    </>
  );
}
