type Props = {
  onLoginWithGoogle: () => void;
  onContinueAsGuest: () => void;
};

/** Render unauthenticated entry choices for login or guest mode. */
export function LandingPage({ onLoginWithGoogle, onContinueAsGuest }: Props) {
  return (
    <section className="mx-auto mt-8 max-w-2xl rounded-xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome to Scripture &amp; Solace
      </h1>
      <p className="mt-3 text-base text-slate-700">
        Read scripture, save passages, and find emotional support. Sign in to
        sync your account, or continue as a guest for local use.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="min-h-12 rounded-md border border-slate-300 bg-white px-4 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
          onClick={onLoginWithGoogle}>
          Continue with Google
        </button>
        <button
          type="button"
          className="min-h-12 rounded-md bg-indigo-600 px-4 py-2 text-left text-sm font-semibold text-white hover:bg-indigo-500"
          onClick={onContinueAsGuest}>
          Continue as Guest
        </button>
      </div>
    </section>
  );
}
