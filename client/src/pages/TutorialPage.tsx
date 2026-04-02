import { SectionHeader } from '@/components/ui';
import { lazy, Suspense } from 'react';

const TutorialGettingStarted = lazy(
  () => import('@/content/tutorial/sections/01-getting-started.mdx'),
);
const TutorialSupport = lazy(
  () => import('@/content/tutorial/sections/02-support.mdx'),
);
const TutorialLearnContext = lazy(
  () => import('@/content/tutorial/sections/07-learn-context.mdx'),
);
const TutorialSearch = lazy(
  () => import('@/content/tutorial/sections/03-search.mdx'),
);
const TutorialSaved = lazy(
  () => import('@/content/tutorial/sections/04-saved.mdx'),
);
const TutorialReader = lazy(
  () => import('@/content/tutorial/sections/05-reader.mdx'),
);
const TutorialDisplaySettings = lazy(
  () => import('@/content/tutorial/sections/08-display-settings.mdx'),
);
const TutorialPrayerHubs = lazy(
  () => import('@/content/tutorial/sections/09-prayer-hubs.mdx'),
);
const TutorialWrapUp = lazy(
  () => import('@/content/tutorial/sections/06-wrap-up.mdx'),
);

/** Provide guided route-by-route usage instructions for the app (MDX sections). */
export function TutorialPage() {
  return (
    <>
      <SectionHeader
        title="Tutorial"
        description="A step-by-step guide to get help quickly, save verses, and return to what matters."
      />
      <Suspense
        fallback={
          <p className="text-sm text-slate-600" role="status">
            Loading tutorial sections…
          </p>
        }>
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
      </Suspense>
    </>
  );
}
