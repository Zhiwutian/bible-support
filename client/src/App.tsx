import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { EmptyState, Input, ModalShell } from '@/components/ui';
import type {
  AuthFailureReason,
  AuthRedirectOutcome,
} from '@shared/auth-contracts';
import {
  logout as logoutAuth,
  readAuthMe,
  redirectToLogin,
} from '@/features/auth/auth-api';
import { useAppDispatch, useAppState } from '@/state';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
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
const SearchPage = lazy(async () => ({
  default: (await import('@/pages/SearchPage')).SearchPage,
}));
const SavedScripturesPage = lazy(async () => ({
  default: (await import('@/pages/SavedScripturesPage')).SavedScripturesPage,
}));
const SavedBookScripturesPage = lazy(async () => ({
  default: (await import('@/pages/SavedBookScripturesPage'))
    .SavedBookScripturesPage,
}));

/**
 * Render the app shell and route-level pages.
 */
export default function App() {
  const { showToast } = useToast();
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTextSizeModalOpen, setIsTextSizeModalOpen] = useState(false);
  const [previewTextScale, setPreviewTextScale] = useState<
    'sm' | 'md' | 'lg' | 'xl'
  >('md');
  const [initialTextScale, setInitialTextScale] = useState<
    'sm' | 'md' | 'lg' | 'xl'
  >('md');
  const [initialHighContrast, setInitialHighContrast] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const textScaleClassName =
    state.textScale === 'xl'
      ? 'app-text-scale-xl'
      : state.textScale === 'lg'
        ? 'app-text-scale-lg'
        : state.textScale === 'md'
          ? 'app-text-scale-md'
          : 'app-text-scale-sm';
  const contrastClassName = state.highContrast
    ? 'app-high-contrast bg-white text-black'
    : 'bg-sky-50 text-slate-900';
  const navClassName = state.highContrast
    ? 'bg-white text-black border-slate-300'
    : 'bg-sky-50/95 text-slate-900 border-sky-100';
  const textSizeLabel =
    state.textScale === 'xl'
      ? 'XL'
      : state.textScale === 'lg'
        ? 'Large'
        : state.textScale === 'md'
          ? 'Medium'
          : 'Small';

  const openDisplaySettingsModal = useCallback(() => {
    setInitialTextScale(state.textScale);
    setInitialHighContrast(state.highContrast);
    setPreviewTextScale(state.textScale);
    setIsTextSizeModalOpen(true);
  }, [state.highContrast, state.textScale]);

  const cancelDisplaySettingsModal = useCallback(() => {
    dispatch({
      type: 'textScale/set',
      payload: initialTextScale,
    });
    dispatch({
      type: 'highContrast/set',
      payload: initialHighContrast,
    });
    setIsTextSizeModalOpen(false);
  }, [dispatch, initialHighContrast, initialTextScale]);

  const applyDisplaySettingsModal = useCallback(() => {
    setIsTextSizeModalOpen(false);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    readAuthMe()
      .then((payload) => {
        if (!isCancelled) {
          setAuthUserId(payload.isAuthenticated ? payload.userId : null);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setAuthUserId(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsAuthLoading(false);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const authOutcome = url.searchParams.get(
      'auth',
    ) as AuthRedirectOutcome | null;
    if (!authOutcome) return;

    if (authOutcome === 'success') {
      readAuthMe()
        .then((payload) => {
          setAuthUserId(payload.isAuthenticated ? payload.userId : null);
          if (payload.isAuthenticated) {
            showToast({
              title: 'Signed in',
              description: 'Your account session is active.',
              variant: 'success',
            });
            return;
          }
          showToast({
            title: 'Sign-in incomplete',
            description: 'Could not confirm session state. Please try again.',
            variant: 'error',
          });
        })
        .catch(() => {
          showToast({
            title: 'Sign-in incomplete',
            description: 'Could not confirm session state. Please try again.',
            variant: 'error',
          });
        });
    } else {
      const reason = url.searchParams.get('reason') as AuthFailureReason | null;
      const callbackMessage = url.searchParams.get('message');
      const description =
        callbackMessage ||
        (reason === 'provider_rejected'
          ? 'Sign-in was cancelled at the provider.'
          : reason === 'invalid_state'
            ? 'Sign-in session expired. Please try again.'
            : reason === 'auth_not_enabled'
              ? 'Authentication is not enabled for this environment.'
              : 'Could not complete sign-in. Please try again.');
      showToast({
        title: 'Sign-in failed',
        description,
        variant: 'error',
      });
    }

    url.searchParams.delete('auth');
    url.searchParams.delete('reason');
    url.searchParams.delete('message');
    window.history.replaceState({}, '', url.toString());
  }, [showToast]);

  const handleLogin = useCallback(() => {
    redirectToLogin();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutAuth();
      setAuthUserId(null);
      showToast({
        title: 'Signed out',
        variant: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Could not sign out',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  }, [showToast]);

  useEffect(() => {
    function handleEscapeClose(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (isTextSizeModalOpen) {
        cancelDisplaySettingsModal();
        return;
      }
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleEscapeClose);
    return () => {
      window.removeEventListener('keydown', handleEscapeClose);
    };
  }, [cancelDisplaySettingsModal, isMobileMenuOpen, isTextSizeModalOpen]);

  return (
    <main
      className={`mx-auto min-h-screen w-full max-w-4xl px-6 py-10 ${contrastClassName} ${textScaleClassName}`}>
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-30 bg-black/45 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <header
        className={`sticky top-0 z-40 -mx-6 mb-6 border-b px-6 py-3 backdrop-blur ${navClassName}`}>
        <nav className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <NavLinkButton to="/">Emotions</NavLinkButton>
            <NavLinkButton to="/search">Search</NavLinkButton>
            <NavLinkButton to="/saved">Saved</NavLinkButton>
            <NavLinkButton to="/about">About</NavLinkButton>
          </div>

          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100 md:hidden"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-main-menu"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMobileMenuOpen((open) => !open)}>
            {isMobileMenuOpen ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-6"
                  aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6l12 12M6 18L18 6"
                  />
                </svg>
                <span>Close</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-6"
                  aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7h16M4 12h16M4 17h16"
                  />
                </svg>
                <span>Menu</span>
              </>
            )}
          </button>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            <button
              type="button"
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              onClick={authUserId ? () => void handleLogout() : handleLogin}
              disabled={isAuthLoading}>
              {isAuthLoading
                ? 'Checking login...'
                : authUserId
                  ? 'Log out'
                  : 'Sign in'}
            </button>
            <label className="flex items-center gap-2 text-sm font-medium">
              Text size
              <select
                className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
                value={state.textScale}
                onChange={(event) =>
                  dispatch({
                    type: 'textScale/set',
                    payload: event.target.value as 'sm' | 'md' | 'lg' | 'xl',
                  })
                }>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">XL</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Input
                className="size-5"
                type="checkbox"
                checked={state.highContrast}
                onChange={(event) =>
                  dispatch({
                    type: 'highContrast/set',
                    payload: event.target.checked,
                  })
                }
              />
              High contrast
            </label>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div
            id="mobile-main-menu"
            className="mt-3 space-y-3 border-t border-slate-200 pt-3 md:hidden">
            <div className="grid grid-cols-1 gap-2">
              <NavLinkButton
                to="/"
                className="justify-start text-base font-semibold"
                onClick={() => setIsMobileMenuOpen(false)}>
                Emotions
              </NavLinkButton>
              <NavLinkButton
                to="/search"
                className="justify-start text-base font-semibold"
                onClick={() => setIsMobileMenuOpen(false)}>
                Search
              </NavLinkButton>
              <NavLinkButton
                to="/saved"
                className="justify-start text-base font-semibold"
                onClick={() => setIsMobileMenuOpen(false)}>
                Saved
              </NavLinkButton>
              <NavLinkButton
                to="/about"
                className="justify-start text-base font-semibold"
                onClick={() => setIsMobileMenuOpen(false)}>
                About
              </NavLinkButton>
            </div>
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-base font-semibold text-slate-800"
              onClick={openDisplaySettingsModal}>
              <span>Display settings</span>
              <span className="text-base font-medium text-slate-600">
                {textSizeLabel}
                {state.highContrast ? ' + High contrast' : ''}
              </span>
            </button>
            <button
              type="button"
              className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-base font-semibold text-slate-800"
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (authUserId) {
                  void handleLogout();
                  return;
                }
                handleLogin();
              }}
              disabled={isAuthLoading}>
              {isAuthLoading
                ? 'Checking login...'
                : authUserId
                  ? 'Log out'
                  : 'Sign in'}
            </button>
          </div>
        )}
      </header>
      {isTextSizeModalOpen && (
        <ModalShell
          title="Display settings"
          titleId="text-size-modal-title"
          className="md:hidden"
          onClose={cancelDisplaySettingsModal}>
          <label className="mt-3 flex items-center gap-2 text-base font-medium text-slate-800">
            <Input
              className="size-5"
              type="checkbox"
              checked={state.highContrast}
              onChange={(event) =>
                dispatch({
                  type: 'highContrast/set',
                  payload: event.target.checked,
                })
              }
            />
            High contrast
          </label>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {(
              [
                ['sm', 'Small'],
                ['md', 'Medium'],
                ['lg', 'Large'],
                ['xl', 'XL'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`min-h-12 rounded-md border px-3 py-2 text-left text-base font-medium ${
                  previewTextScale === value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                    : 'border-slate-300 bg-white text-slate-800'
                }`}
                onClick={() => {
                  setPreviewTextScale(value);
                  dispatch({ type: 'textScale/set', payload: value });
                }}>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="min-h-11 rounded-md px-4 py-2 text-base font-medium text-slate-700 hover:bg-slate-100"
              onClick={cancelDisplaySettingsModal}>
              Cancel
            </button>
            <button
              type="button"
              className="min-h-11 rounded-md bg-indigo-600 px-4 py-2 text-base font-medium text-white hover:bg-indigo-500"
              onClick={applyDisplaySettingsModal}>
              Apply
            </button>
          </div>
        </ModalShell>
      )}

      <Suspense
        fallback={<p className="text-sm text-slate-600">Loading page...</p>}>
        <Routes>
          <Route path="/" element={<EmotionsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/saved" element={<SavedScripturesPage />} />
          <Route path="/saved/:book" element={<SavedBookScripturesPage />} />
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
