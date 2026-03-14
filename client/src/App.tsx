import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { EmptyState, Input, ModalShell } from '@/components/ui';
import { LandingPage } from '@/pages/LandingPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { trackEvent } from '@/lib/telemetry';
import type {
  AuthFailureReason,
  AuthRedirectOutcome,
  AuthSocialProvider,
} from '@shared/auth-contracts';
import {
  logout as logoutAuth,
  readAuthMe,
  redirectToLogin,
  updateAuthProfile,
} from '@/features/auth/auth-api';
import { useAppDispatch, useAppState } from '@/state';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

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
const AdminPage = lazy(async () => ({
  default: (await import('@/pages/AdminPage')).AdminPage,
}));

/**
 * Render the app shell and route-level pages.
 */
export default function App() {
  const { showToast } = useToast();
  const state = useAppState();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopNavOpen, setIsDesktopNavOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);
  const [hasEnteredGuestMode, setHasEnteredGuestMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem('guest-mode') === 'true';
  });
  const [isTextSizeModalOpen, setIsTextSizeModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [previewTextScale, setPreviewTextScale] = useState<
    'sm' | 'md' | 'lg' | 'xl'
  >('md');
  const [initialTextScale, setInitialTextScale] = useState<
    'sm' | 'md' | 'lg' | 'xl'
  >('md');
  const [initialHighContrast, setInitialHighContrast] = useState(false);
  const [authSession, setAuthSession] = useState<{
    userId: string;
    role: 'user' | 'admin';
    displayName: string | null;
    avatarUrl: string | null;
  } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [enabledSocialProviders, setEnabledSocialProviders] = useState<
    AuthSocialProvider[]
  >(['google']);
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
  const currentRouteIntent = `${location.pathname}${location.search}${location.hash}`;
  const shouldShowLanding =
    !isAuthLoading && !authSession && !hasEnteredGuestMode;

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
          setEnabledSocialProviders(payload.enabledSocialProviders);
          setAuthSession(
            payload.isAuthenticated && payload.userId && payload.role
              ? {
                  userId: payload.userId,
                  role: payload.role,
                  displayName: payload.displayName,
                  avatarUrl: payload.avatarUrl,
                }
              : null,
          );
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setAuthSession(null);
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
    window.sessionStorage.setItem('guest-mode', String(hasEnteredGuestMode));
  }, [hasEnteredGuestMode]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const authOutcome = url.searchParams.get(
      'auth',
    ) as AuthRedirectOutcome | null;
    if (!authOutcome) return;

    if (authOutcome === 'success') {
      const nextPath = url.searchParams.get('next');
      readAuthMe()
        .then((payload) => {
          setEnabledSocialProviders(payload.enabledSocialProviders);
          setAuthSession(
            payload.isAuthenticated && payload.userId && payload.role
              ? {
                  userId: payload.userId,
                  role: payload.role,
                  displayName: payload.displayName,
                  avatarUrl: payload.avatarUrl,
                }
              : null,
          );
          if (payload.isAuthenticated) {
            setHasEnteredGuestMode(false);
            if (
              nextPath &&
              nextPath.startsWith('/') &&
              !nextPath.startsWith('//')
            ) {
              navigate(nextPath, { replace: true });
            }
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
  }, [navigate, showToast]);

  const handleLogin = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  const startSocialLogin = useCallback(
    (provider: AuthSocialProvider, next?: string) => {
      trackEvent('auth_login_click', {
        provider,
        next: next ?? '/',
        guestMode: hasEnteredGuestMode,
      });
      setHasEnteredGuestMode(false);
      setIsDesktopNavOpen(false);
      setIsMobileMenuOpen(false);
      setIsLoginModalOpen(false);
      redirectToLogin(provider, next);
    },
    [hasEnteredGuestMode],
  );
  const continueAsGuest = useCallback(() => {
    trackEvent('guest_continue_click', {
      routeIntent: currentRouteIntent,
    });
    setHasEnteredGuestMode(true);
    setIsLoginModalOpen(false);
    if (currentRouteIntent !== '/') {
      navigate(currentRouteIntent, { replace: true });
    }
  }, [currentRouteIntent, navigate]);
  const handleProfileSave = useCallback(
    async (payload: {
      displayName: string | null;
      avatarUrl: string | null;
    }) => {
      const updated = await updateAuthProfile(payload);
      setAuthSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          displayName: updated.displayName,
          avatarUrl: updated.avatarUrl,
          role: updated.role,
        };
      });
      showToast({
        title: 'Profile updated',
        description: 'Your profile changes were saved.',
        variant: 'success',
      });
    },
    [showToast],
  );

  const handleLogout = useCallback(async () => {
    try {
      await logoutAuth();
      setAuthSession(null);
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
      if (isLoginModalOpen) {
        setIsLoginModalOpen(false);
        return;
      }
      if (isDesktopNavOpen) {
        setIsDesktopNavOpen(false);
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
  }, [
    cancelDisplaySettingsModal,
    isDesktopNavOpen,
    isLoginModalOpen,
    isMobileMenuOpen,
    isTextSizeModalOpen,
  ]);

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
      {isDesktopNavOpen && (
        <div className="hidden md:block xl:hidden">
          <button
            type="button"
            aria-label="Close desktop navigation overlay"
            className="fixed inset-0 z-30 bg-black/35"
            onClick={() => setIsDesktopNavOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-4 shadow-lg">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Menu
            </h2>
            <div className="grid grid-cols-1 gap-2">
              <NavLinkButton
                to="/"
                className="justify-start text-base font-semibold"
                onClick={() => setIsDesktopNavOpen(false)}>
                Emotions
              </NavLinkButton>
              <NavLinkButton
                to="/search"
                className="justify-start text-base font-semibold"
                onClick={() => setIsDesktopNavOpen(false)}>
                Search
              </NavLinkButton>
              <NavLinkButton
                to="/saved"
                className="justify-start text-base font-semibold"
                onClick={() => setIsDesktopNavOpen(false)}>
                Saved
              </NavLinkButton>
              <NavLinkButton
                to="/about"
                className="justify-start text-base font-semibold"
                onClick={() => setIsDesktopNavOpen(false)}>
                About
              </NavLinkButton>
              {authSession ? (
                <NavLinkButton
                  to="/profile"
                  className="justify-start text-base font-semibold"
                  onClick={() => setIsDesktopNavOpen(false)}>
                  Profile
                </NavLinkButton>
              ) : null}
              {authSession?.role === 'admin' ? (
                <NavLinkButton
                  to="/admin"
                  className="justify-start text-base font-semibold"
                  onClick={() => setIsDesktopNavOpen(false)}>
                  Admin
                </NavLinkButton>
              ) : null}
            </div>
          </aside>
        </div>
      )}
      <div className="xl:flex xl:gap-6">
        {!isDesktopSidebarCollapsed ? (
          <aside className="hidden xl:block xl:w-64 xl:shrink-0">
            <div className="sticky top-6 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                Menu
              </h2>
              <div className="grid grid-cols-1 gap-2">
                <NavLinkButton
                  to="/"
                  className="justify-start text-base font-semibold">
                  Emotions
                </NavLinkButton>
                <NavLinkButton
                  to="/search"
                  className="justify-start text-base font-semibold">
                  Search
                </NavLinkButton>
                <NavLinkButton
                  to="/saved"
                  className="justify-start text-base font-semibold">
                  Saved
                </NavLinkButton>
                <NavLinkButton
                  to="/about"
                  className="justify-start text-base font-semibold">
                  About
                </NavLinkButton>
                {authSession ? (
                  <NavLinkButton
                    to="/profile"
                    className="justify-start text-base font-semibold">
                    Profile
                  </NavLinkButton>
                ) : null}
                {authSession?.role === 'admin' ? (
                  <NavLinkButton
                    to="/admin"
                    className="justify-start text-base font-semibold">
                    Admin
                  </NavLinkButton>
                ) : null}
              </div>
            </div>
          </aside>
        ) : null}
        <div className="min-w-0 flex-1">
          <header
            className={`sticky top-0 z-40 -mx-6 mb-6 border-b px-6 py-3 backdrop-blur ${navClassName}`}>
            <nav className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 pr-1">
                <img
                  src="/logo-glow-bible.svg"
                  alt="Scripture and Solace logo"
                  className="size-8 rounded-sm"
                />
                <span className="hidden text-sm font-semibold text-slate-800 sm:inline">
                  Scripture &amp; Solace
                </span>
              </div>
              <button
                type="button"
                className="hidden min-h-11 items-center gap-2 rounded-md px-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100 md:inline-flex xl:hidden"
                aria-label={
                  isDesktopNavOpen ? 'Close desktop menu' : 'Open desktop menu'
                }
                onClick={() => setIsDesktopNavOpen((open) => !open)}>
                Menu
              </button>
              <button
                type="button"
                className="hidden min-h-11 items-center gap-2 rounded-md px-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100 xl:inline-flex"
                aria-label={
                  isDesktopSidebarCollapsed
                    ? 'Open pinned sidebar menu'
                    : 'Collapse pinned sidebar menu'
                }
                onClick={() =>
                  setIsDesktopSidebarCollapsed((collapsed) => !collapsed)
                }>
                {isDesktopSidebarCollapsed ? 'Open menu' : 'Hide menu'}
              </button>

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
                  onClick={
                    authSession ? () => void handleLogout() : handleLogin
                  }
                  disabled={isAuthLoading}>
                  {isAuthLoading
                    ? 'Checking login...'
                    : authSession
                      ? 'Log out'
                      : 'Sign in'}
                </button>
                {!authSession && hasEnteredGuestMode ? (
                  <button
                    type="button"
                    className="min-h-11 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
                    onClick={() =>
                      startSocialLogin('google', currentRouteIntent)
                    }>
                    Guest mode - Sign in
                  </button>
                ) : null}
                <label className="flex items-center gap-2 text-sm font-medium">
                  Text size
                  <select
                    className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
                    value={state.textScale}
                    onChange={(event) =>
                      dispatch({
                        type: 'textScale/set',
                        payload: event.target.value as
                          | 'sm'
                          | 'md'
                          | 'lg'
                          | 'xl',
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
                  {authSession ? (
                    <NavLinkButton
                      to="/profile"
                      className="justify-start text-base font-semibold"
                      onClick={() => setIsMobileMenuOpen(false)}>
                      Profile
                    </NavLinkButton>
                  ) : null}
                  {authSession?.role === 'admin' ? (
                    <NavLinkButton
                      to="/admin"
                      className="justify-start text-base font-semibold"
                      onClick={() => setIsMobileMenuOpen(false)}>
                      Admin
                    </NavLinkButton>
                  ) : null}
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
                    if (authSession) {
                      void handleLogout();
                      return;
                    }
                    handleLogin();
                  }}
                  disabled={isAuthLoading}>
                  {isAuthLoading
                    ? 'Checking login...'
                    : authSession
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
          {isLoginModalOpen && (
            <ModalShell
              title="Sign in"
              titleId="login-modal-title"
              onClose={() => setIsLoginModalOpen(false)}
              panelClassName="max-w-md">
              <p className="mt-2 text-sm text-slate-600">
                Choose a provider to continue.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={() =>
                    startSocialLogin('google', currentRouteIntent)
                  }>
                  Continue with Google
                </button>
                {enabledSocialProviders.includes('facebook') ? (
                  <button
                    type="button"
                    className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={() =>
                      startSocialLogin('facebook', currentRouteIntent)
                    }>
                    Continue with Facebook
                  </button>
                ) : (
                  <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Facebook sign-in is temporarily disabled and can be
                    re-enabled later when a Meta developer app is configured.
                  </p>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="min-h-10 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  onClick={() => setIsLoginModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </ModalShell>
          )}

          <Suspense
            fallback={
              <p className="text-sm text-slate-600">Loading page...</p>
            }>
            <Routes>
              {shouldShowLanding ? (
                <Route
                  path="*"
                  element={
                    <LandingPage
                      onLoginWithGoogle={() =>
                        startSocialLogin('google', currentRouteIntent)
                      }
                      onContinueAsGuest={continueAsGuest}
                    />
                  }
                />
              ) : (
                <>
                  <Route path="/" element={<EmotionsPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/saved" element={<SavedScripturesPage />} />
                  <Route
                    path="/saved/:book"
                    element={<SavedBookScripturesPage />}
                  />
                  <Route
                    path="/admin"
                    element={
                      authSession?.role === 'admin' ? (
                        <AdminPage authUserId={authSession.userId} />
                      ) : (
                        <EmptyState
                          title="Admin access required"
                          description="This page is only available to administrator accounts."
                        />
                      )
                    }
                  />
                  <Route
                    path="/emotions/:slug"
                    element={<EmotionScripturePage />}
                  />
                  <Route
                    path="/emotions/:slug/context"
                    element={<FullContextPage />}
                  />
                  <Route path="/about" element={<AboutPage />} />
                  <Route
                    path="/profile"
                    element={
                      authSession ? (
                        <ProfilePage
                          initialDisplayName={authSession.displayName}
                          initialAvatarUrl={authSession.avatarUrl}
                          onSave={handleProfileSave}
                        />
                      ) : (
                        <EmptyState
                          title="Sign in required"
                          description="You must be signed in to edit your profile."
                        />
                      )
                    }
                  />
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
                </>
              )}
            </Routes>
          </Suspense>
        </div>
      </div>
    </main>
  );
}
