import { NavLinkButton } from '@/components/app/NavLinkButton';
import { EmptyState } from '@/components/ui';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const EmotionsPage = lazy(async () => ({
  default: (await import('@/pages/EmotionsPage')).EmotionsPage,
}));
const EmotionScripturePage = lazy(async () => ({
  default: (await import('@/pages/EmotionScripturePage')).EmotionScripturePage,
}));
const FullContextPage = lazy(async () => ({
  default: (await import('@/pages/FullContextPage')).FullContextPage,
}));
const AboutPage = lazy(async () => ({
  default: (await import('@/pages/AboutPage')).AboutPage,
}));

/**
 * Render the app shell and route-level pages.
 */
export default function App() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl bg-sky-50 px-6 py-10 text-slate-900">
      <nav className="mb-6 flex gap-2">
        <NavLinkButton to="/">Emotions</NavLinkButton>
        <NavLinkButton to="/about">About</NavLinkButton>
      </nav>

      <Suspense
        fallback={<p className="text-sm text-slate-600">Loading page...</p>}>
        <Routes>
          <Route path="/" element={<EmotionsPage />} />
          <Route path="/emotions/:slug" element={<EmotionScripturePage />} />
          <Route path="/emotions/:slug/context" element={<FullContextPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="*"
            element={
              <EmptyState
                title="Page not found"
                description="The route you requested does not exist."
                actions={
                  <NavLinkButton
                    to="/"
                    className="bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 hover:text-white">
                    Go to emotions
                  </NavLinkButton>
                }
              />
            }
          />
        </Routes>
      </Suspense>
    </main>
  );
}
