import { NavLinkButton } from '@/components/app/NavLinkButton';
import { BrandLockup } from '@/components/app/BrandLockup';
import { MenuHeader } from '@/components/app/MenuHeader';
import { useToast } from '@/components/app/toast-context';
import {
  Button,
  EmptyState,
  Input,
  ModalShell,
  SettingHelpButton,
  SettingHelpModal,
} from '@/components/ui';
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
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
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
const TutorialPage = lazy(async () => ({
  default: (await import('@/pages/TutorialPage')).TutorialPage,
}));
const SearchPage = lazy(async () => ({
  default: (await import('@/pages/SearchPage')).SearchPage,
}));
const BibleReaderPage = lazy(async () => ({
  default: (await import('@/pages/BibleReaderPage')).BibleReaderPage,
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
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const lastScrollYRef = useRef(0);
  const menuScrollContainerRef = useRef<HTMLDivElement | null>(null);
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
  const [initialDarkMode, setInitialDarkMode] = useState(false);
  const [settingsHelp, setSettingsHelp] = useState<{
    title: string;
    description: string;
  } | null>(null);
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
    : state.darkMode
      ? 'app-dark-mode bg-slate-950 text-slate-100'
      : 'bg-sky-50 text-slate-900';
  const navClassName = state.highContrast
    ? 'bg-white text-black border-slate-300'
    : state.darkMode
      ? 'bg-slate-900/95 text-slate-100 border-slate-700'
      : 'bg-sky-50/95 text-slate-900 border-sky-100';
  const textSizeLabel =
    state.textScale === 'xl'
      ? 'XL'
      : state.textScale === 'lg'
        ? 'Large'
        : state.textScale === 'md'
          ? 'Medium'
          : 'Small';
  const accountDisplayName =
    authSession?.displayName?.trim() ||
    (authSession ? 'Signed in user' : 'Guest');
  const accountInitial = accountDisplayName.charAt(0).toUpperCase();
  const currentRouteIntent = `${location.pathname}${location.search}${location.hash}`;
  const shouldShowLanding =
    !isAuthLoading && !authSession && !hasEnteredGuestMode;

  const openDisplaySettingsModal = useCallback(() => {
    setInitialTextScale(state.textScale);
    setInitialHighContrast(state.highContrast);
    setInitialDarkMode(state.darkMode);
    setPreviewTextScale(state.textScale);
    setIsTextSizeModalOpen(true);
  }, [state.darkMode, state.highContrast, state.textScale]);

  const cancelDisplaySettingsModal = useCallback(() => {
    dispatch({
      type: 'textScale/set',
      payload: initialTextScale,
    });
    dispatch({
      type: 'highContrast/set',
      payload: initialHighContrast,
    });
    dispatch({
      type: 'darkMode/set',
      payload: initialDarkMode,
    });
    setIsTextSizeModalOpen(false);
  }, [dispatch, initialDarkMode, initialHighContrast, initialTextScale]);

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
    isLoginModalOpen,
    isMobileMenuOpen,
    isTextSizeModalOpen,
  ]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    if (!menuScrollContainerRef.current) return;
    menuScrollContainerRef.current.scrollTop = 0;
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const COMPACT_ENTER_SCROLL_Y = 56;
    const COMPACT_EXIT_SCROLL_Y = 24;
    const MIN_SCROLLABLE_DISTANCE = 80;

    function getMaxScrollableDistance() {
      return Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    }

    function handleHeaderScroll() {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;
      const maxScrollableDistance = getMaxScrollableDistance();

      setIsHeaderCompact((previous) => {
        if (currentScrollY <= 0) return false;
        if (!previous) {
          return (
            scrollingDown &&
            maxScrollableDistance >= MIN_SCROLLABLE_DISTANCE &&
            currentScrollY >= COMPACT_ENTER_SCROLL_Y
          );
        }
        if (!scrollingDown && currentScrollY <= COMPACT_EXIT_SCROLL_Y) {
          return false;
        }
        return true;
      });
    }

    handleHeaderScroll();
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    window.addEventListener('resize', handleHeaderScroll);
    return () => {
      window.removeEventListener('scroll', handleHeaderScroll);
      window.removeEventListener('resize', handleHeaderScroll);
    };
  }, []);

  return (
    <div
      className={`min-h-screen w-full ${contrastClassName} ${textScaleClassName}`}>
      <main className="mx-auto w-full max-w-[1400px] px-6 py-10">
        {isMobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close navigation menu overlay"
              className="fixed inset-0 z-[70] bg-black/35"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <aside
              id="overlay-main-menu"
              className="fixed inset-y-0 left-0 z-[80] flex h-screen w-[22rem] max-w-[88vw] flex-col overflow-hidden border-r border-slate-200 bg-white p-4 shadow-lg">
              <MenuHeader onClose={() => setIsMobileMenuOpen(false)} />
              <div
                ref={menuScrollContainerRef}
                id="overlay-main-menu-scroll"
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] pr-1">
                <section className="mb-4">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Navigation
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    <NavLinkButton
                      to="/"
                      className="justify-start text-base font-semibold"
                      onClick={() => setIsMobileMenuOpen(false)}>
                      Support
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
                      to="/reader"
                      className="justify-start text-base font-semibold"
                      onClick={() => setIsMobileMenuOpen(false)}>
                      Reader
                    </NavLinkButton>
                    <NavLinkButton
                      to="/tutorial"
                      className="justify-start text-base font-semibold"
                      onClick={() => setIsMobileMenuOpen(false)}>
                      Tutorial
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
                </section>

                <section className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Account
                  </h2>
                  <div className="mb-3 flex items-center gap-3">
                    {authSession?.avatarUrl ? (
                      <img
                        src={authSession.avatarUrl}
                        alt={`${accountDisplayName} avatar`}
                        className="size-10 rounded-full border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                        {accountInitial || 'G'}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {accountDisplayName}
                      </p>
                      <p className="text-xs text-slate-600">
                        {authSession ? 'Signed in' : 'Guest mode'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="min-h-11 w-full justify-start border border-slate-300 bg-white px-3 py-2 text-left text-base font-semibold text-slate-800"
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
                        ? 'Sign out'
                        : 'Sign in'}
                  </Button>
                  {!authSession && hasEnteredGuestMode ? (
                    <Button
                      variant="ghost"
                      className="mt-2 min-h-11 w-full justify-start border border-amber-300 bg-amber-50 px-3 py-2 text-left text-sm font-medium text-amber-800 hover:bg-amber-100"
                      onClick={() =>
                        startSocialLogin('google', currentRouteIntent)
                      }>
                      Sign in to sync saved scriptures
                    </Button>
                  ) : null}
                </section>

                <section>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Display
                  </h2>
                  <Button
                    variant="ghost"
                    className="flex min-h-11 w-full items-center justify-between border border-slate-300 bg-white px-3 py-2 text-left text-base font-semibold text-slate-800"
                    onClick={openDisplaySettingsModal}>
                    <span>Display settings</span>
                    <span className="text-base font-medium text-slate-600">
                      {textSizeLabel}
                      {state.highContrast ? ' + High contrast' : ''}
                      {state.darkMode ? ' + Dark mode' : ''}
                    </span>
                  </Button>
                </section>
              </div>
            </aside>
          </>
        )}
        <div className="mx-auto grid max-w-7xl grid-cols-1 xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-10 xl:col-start-2">
            <header
              className={`sticky top-0 z-40 -mx-6 mb-6 border-b px-6 py-3 backdrop-blur ${navClassName}`}>
              <nav
                className={`flex items-start ${
                  isHeaderCompact
                    ? 'flex-row justify-between gap-3'
                    : 'flex-col gap-2'
                }`}>
                <BrandLockup context="header" compact={isHeaderCompact} />
                <Button
                  variant="ghost"
                  className="inline-flex min-h-11 items-center gap-2 px-3 text-base font-semibold text-slate-700"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="overlay-main-menu"
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
                </Button>
              </nav>
            </header>
            {isTextSizeModalOpen && (
              <ModalShell
                title="Display settings"
                titleId="text-size-modal-title"
                className="md:hidden"
                onClose={cancelDisplaySettingsModal}>
                <div className="mt-3 flex items-center gap-2 text-base font-medium text-slate-800">
                  <label className="flex items-center gap-2">
                    <Input
                      className="size-5"
                      type="checkbox"
                      checked={state.darkMode}
                      onChange={(event) =>
                        dispatch({
                          type: 'darkMode/set',
                          payload: event.target.checked,
                        })
                      }
                    />
                    Dark mode
                  </label>
                  <SettingHelpButton
                    settingLabel="Dark mode"
                    onClick={() =>
                      setSettingsHelp({
                        title: 'Dark mode',
                        description:
                          'Changes overall app surfaces to a darker palette. Reader theme settings still control chapter-reading colors independently.',
                      })
                    }
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-base font-medium text-slate-800">
                  <label className="flex items-center gap-2">
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
                  <SettingHelpButton
                    settingLabel="High contrast"
                    onClick={() =>
                      setSettingsHelp({
                        title: 'High contrast',
                        description:
                          'Increases contrast for interface controls and text readability across the app. Reader theme colors still remain available.',
                      })
                    }
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-base font-medium text-slate-800">
                  <span>Text size</span>
                  <SettingHelpButton
                    settingLabel="Text size"
                    onClick={() =>
                      setSettingsHelp({
                        title: 'Text size',
                        description:
                          'Changes overall app text scale. Use larger options for easier readability throughout menus and pages.',
                      })
                    }
                  />
                </div>
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
                  <Button
                    variant="ghost"
                    className="min-h-11"
                    onClick={cancelDisplaySettingsModal}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="min-h-11"
                    onClick={applyDisplaySettingsModal}>
                    Apply
                  </Button>
                </div>
              </ModalShell>
            )}
            <SettingHelpModal
              help={settingsHelp}
              titleId="settings-help-modal-title"
              onClose={() => setSettingsHelp(null)}
            />
            {isLoginModalOpen && (
              <ModalShell
                title="Scripture & Solace"
                titleId="login-modal-title"
                onClose={() => setIsLoginModalOpen(false)}
                panelClassName="max-w-md">
                <div className="mt-2">
                  <BrandLockup context="modal" />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Sign in to sync your saved scriptures and profile.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  <Button
                    variant="ghost"
                    className="min-h-11 justify-start border border-slate-300 bg-white px-4 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={() =>
                      startSocialLogin('google', currentRouteIntent)
                    }>
                    Continue with Google
                  </Button>
                  {enabledSocialProviders.includes('facebook') ? (
                    <Button
                      variant="ghost"
                      className="min-h-11 justify-start border border-slate-300 bg-white px-4 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                      onClick={() =>
                        startSocialLogin('facebook', currentRouteIntent)
                      }>
                      Continue with Facebook
                    </Button>
                  ) : (
                    <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      Facebook sign-in is temporarily disabled and can be
                      re-enabled later when a Meta developer app is configured.
                    </p>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="ghost"
                    className="min-h-10"
                    onClick={() => setIsLoginModalOpen(false)}>
                    Cancel
                  </Button>
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
                    <Route path="/reader" element={<BibleReaderPage />} />
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
                    <Route path="/tutorial" element={<TutorialPage />} />
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
                              Go to support
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
    </div>
  );
}
