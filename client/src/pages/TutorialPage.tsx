import { Link } from 'react-router-dom';
import { Card, SectionHeader } from '@/components/ui';

/** Provide guided route-by-route usage instructions for the app. */
export function TutorialPage() {
  return (
    <>
      <SectionHeader
        title="Tutorial"
        description="A step-by-step guide to get help quickly, save verses, and return to what matters."
      />

      <Card className="mb-4 border p-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Getting Started
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>
            Start in Support and pick the feeling that best matches your moment.
          </li>
          <li>Use Search when you want a specific reference or topic.</li>
          <li>Save verses, then review and organize them in Saved.</li>
          <li>
            Open Reader for chapter reading, comfort settings, and verse
            actions.
          </li>
        </ol>
        <p className="mt-3 text-xs text-slate-600">
          You can continue as guest, or sign in for profile and account-linked
          sync.
        </p>
      </Card>

      <div className="space-y-3">
        <Card className="border p-4">
          <h3 className="text-base font-semibold text-slate-900">Support</h3>
          <p className="mt-1 text-sm text-slate-700">
            Choose a feeling, read curated verses, then use Actions to copy or
            save. When you need more context, use Read full chapter.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
            <li>Switch translation from the selector near the top.</li>
            <li>Use Learn context for a quick summary.</li>
            <li>Use Read full chapter to continue in Reader.</li>
          </ul>
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
            group, or open results directly in Reader.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
            <li>Guided mode is best when you know book + chapter.</li>
            <li>Reference mode accepts inputs like John 3:16-18.</li>
            <li>Keyword mode helps when you only know the topic.</li>
          </ul>
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
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
            <li>Saved is organized by book first, then verse entries.</li>
            <li>You can keep one personal note per saved verse entry.</li>
            <li>Use Open in Reader to jump back into chapter reading.</li>
          </ul>
          <Link
            to="/saved"
            className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-600">
            Open Saved
          </Link>
        </Card>

        <Card className="border p-4">
          <h3 className="text-base font-semibold text-slate-900">Reader</h3>
          <p className="mt-1 text-sm text-slate-700">
            Read chapter-by-chapter, bookmark your place, and use verse actions
            to save, note, or share individual verses.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
            <li>Tap a verse to open actions.</li>
            <li>Use Options to adjust theme, font, spacing, and layout.</li>
            <li>Use Share verse to create a public verse detail link.</li>
          </ul>
          <Link
            to="/reader"
            className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-600">
            Open Reader
          </Link>
        </Card>

        <Card className="border p-4">
          <h3 className="text-base font-semibold text-slate-900">
            Shared Verse Links
          </h3>
          <p className="mt-1 text-sm text-slate-700">
            Shared links open a dedicated verse detail page with actions to open
            Reader, Search, or Support.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
            <li>Use Share verse from Reader to send a link.</li>
            <li>Recipients can open links as guest or signed-in users.</li>
            <li>Copy Link is available if native sharing is unavailable.</li>
          </ul>
          <Link
            to="/verse?book=John&chapter=3&verse=16&translation=KJV"
            className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-600">
            Open Example Shared Verse
          </Link>
        </Card>

        <Card className="border p-4">
          <h3 className="text-base font-semibold text-slate-900">
            About, Profile, and Admin
          </h3>
          <p className="mt-1 text-sm text-slate-700">
            About includes FAQs and route guidance. Profile lets signed-in users
            update display name and avatar. Admin is available to admin
            accounts.
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
            <Link
              to="/admin"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-600">
              Open Admin
            </Link>
          </div>
        </Card>

        <Card className="border p-4">
          <h3 className="text-base font-semibold text-slate-900">
            Troubleshooting
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>
              If something does not load, use Try again and keep your current
              route.
            </li>
            <li>If saving fails, check your connection and try once more.</li>
            <li>
              If share does not open on your device, use Copy Link instead.
            </li>
            <li>
              If Reader content looks off, open Options and reset reader
              settings.
            </li>
          </ul>
        </Card>

        <Card className="border p-4">
          <h3 className="text-base font-semibold text-slate-900">
            Recommended Next Steps
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
            <li>Save one verse from Support and one from Search.</li>
            <li>Add a short note in Saved.</li>
            <li>Share one verse from Reader and open the shared page.</li>
          </ol>
        </Card>
      </div>
    </>
  );
}
