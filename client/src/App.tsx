import { NavLinkButton } from '@/components/app/NavLinkButton';
import { EmptyState } from '@/components/ui';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const TodosPage = lazy(async () => ({
  default: (await import('@/pages/TodosPage')).TodosPage,
}));
const AboutPage = lazy(async () => ({
  default: (await import('@/pages/AboutPage')).AboutPage,
}));

/**
 * Render the app shell and route-level pages.
 */
export default function App() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl bg-slate-50 px-6 py-10 text-slate-900">
      <nav className="mb-6 flex gap-2">
        <NavLinkButton to="/">Todos</NavLinkButton>
        <NavLinkButton to="/about">About</NavLinkButton>
      </nav>

      <Suspense
        fallback={<p className="text-sm text-slate-600">Loading page...</p>}>
        <Routes>
          <Route path="/" element={<TodosPage />} />
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
                    Go to todos
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
