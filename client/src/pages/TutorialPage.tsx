import { Link } from 'react-router-dom';
import { Card, SectionHeader } from '@/components/ui';

/** Provide guided route-by-route usage instructions for the app. */
export function TutorialPage() {
  return (
    <>
      <SectionHeader
        title="Tutorial"
        description="Learn what each route does and the quickest way to use it."
      />

      <Card className="mb-4 border p-4">
        <h2 className="text-lg font-semibold text-slate-900">Quick Start</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Start on Support to pick how you are feeling.</li>
          <li>Open Search to find specific references or keyword matches.</li>
          <li>Save verses and review them in Saved.</li>
          <li>
            Use Reader for long-form chapter reading and comfort settings.
          </li>
        </ol>
      </Card>

      <div className="space-y-3">
        <Card className="border p-4">
          <h3 className="text-base font-semibold text-slate-900">Support</h3>
          <p className="mt-1 text-sm text-slate-700">
            Choose a feeling, read curated verses, and use Actions to copy or
            save. Use Read full chapter to continue in Reader with matching
            chapter context.
          </p>
          <Link
            to="/"
            className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-600">
            Open Support
          </Link>
        </Card>

        <Card className="border p-4">
          <h3 className="text-base font-semibold text-slate-900">Search</h3>
          <p className="mt-1 text-sm text-slate-700">
            Use Guided, Reference, or Keyword mode. Save one verse, save a
            group, or open a result directly in Reader.
          </p>
          <Link
            to="/search"
            className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-600">
            Open Search
          </Link>
        </Card>

        <Card className="border p-4">
          <h3 className="text-base font-semibold text-slate-900">Saved</h3>
          <p className="mt-1 text-sm text-slate-700">
            Review saved verses by book, edit translation and notes, remove
            entries, or reopen items in Reader at the matching verse.
          </p>
          <Link
            to="/saved"
            className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-600">
            Open Saved
          </Link>
        </Card>

        <Card className="border p-4">
          <h3 className="text-base font-semibold text-slate-900">Reader</h3>
          <p className="mt-1 text-sm text-slate-700">
            Read chapter-by-chapter, set bookmarks by clicking verse lines, and
            use Options for theme, typography, spacing, reading style, and
            indicator display controls.
          </p>
          <Link
            to="/reader"
            className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-600">
            Open Reader
          </Link>
        </Card>

        <Card className="border p-4">
          <h3 className="text-base font-semibold text-slate-900">
            About and Profile
          </h3>
          <p className="mt-1 text-sm text-slate-700">
            About contains FAQs and product context. Profile lets signed-in
            users update display name and avatar.
          </p>
          <div className="mt-2 flex flex-wrap gap-4">
            <Link
              to="/about"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-600">
              Open About
            </Link>
            <Link
              to="/profile"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-600">
              Open Profile
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
