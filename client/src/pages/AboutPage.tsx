import { SectionHeader } from '@/components/ui';
import { Link } from 'react-router-dom';

/**
 * Render a simple About page to demonstrate route-level screens.
 */
export function AboutPage() {
  return (
    <>
      <SectionHeader
        title="About This Website"
        description="Scripture & Solace provides Scriptural Support, flexible Bible search tools, saved verse organization, and profile-based account access."
      />
      <div className="space-y-4">
        <p className="text-base leading-relaxed text-slate-700">
          Use <strong>Support</strong> to find emotion-based scripture reading
          paths, <strong>Search</strong> for guided/reference/keyword verse
          lookup, and <strong>Saved</strong> to manage your collected passages
          and translation preferences.
        </p>
        <p className="text-base leading-relaxed text-slate-700">
          You can continue as a guest for local use, or sign in to access
          account-linked profile settings and synced saved scripture ownership.
        </p>
      </div>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
        <div className="mt-3 space-y-4">
          <article className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">
              How do I start getting support?
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              Open the Support page and choose the feeling that best matches
              your current state.
            </p>
            <Link
              to="/"
              className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-600">
              Go to Support
            </Link>
          </article>

          <article className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">
              Can I search by verse reference or keyword?
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              Yes. In Search, choose a Search Type, then use guided picker,
              reference input, or keyword lookup.
            </p>
            <Link
              to="/search"
              className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-600">
              Open Search
            </Link>
          </article>

          <article className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">
              How do saved scriptures work?
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              Save verses from Search, then review and organize them on Saved.
              You can adjust translations for saved items from the saved views.
            </p>
            <Link
              to="/saved"
              className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-600">
              View Saved Scriptures
            </Link>
          </article>

          <article className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">
              Do I need to sign in?
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              No. You can continue as guest. Signing in is recommended when you
              want account-based identity and profile management.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
