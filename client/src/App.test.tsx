import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@/components/app/ToastProvider';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import App from './App';
import { AppStateProvider } from '@/state';
import { MemoryRouter } from 'react-router-dom';
import { server } from '@/test/server';
import { isPrivacySafeReaderComfortRolloutPayload } from '@/features/reader/reader-comfort-telemetry';

function renderApp(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

async function continueAsGuest(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole('button', { name: /continue as guest/i }),
  );
}

describe('App', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('renders emotion tiles on home route', async () => {
    const user = userEvent.setup();
    renderApp();
    await continueAsGuest(user);

    expect(
      await screen.findByRole('heading', { name: /scriptural support/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText('I Am Afraid')).toBeInTheDocument();
    expect(await screen.findByText('I Am Angry')).toBeInTheDocument();
    expect(await screen.findByText('I Am Stressed')).toBeInTheDocument();
    expect(await screen.findByText('I Am Feeling Guilty')).toBeInTheDocument();
  });

  it('shows tutorial link on support home', async () => {
    const user = userEvent.setup();
    renderApp();
    await continueAsGuest(user);

    const tutorialLink = await screen.findByRole('link', {
      name: /^tutorial$/i,
    });
    expect(tutorialLink).toHaveAttribute('href', '/tutorial');
    await user.click(tutorialLink);
    expect(
      await screen.findByRole('heading', { name: 'Tutorial' }),
    ).toBeInTheDocument();
  });

  it('navigates to emotion scripture viewer and back', async () => {
    const user = userEvent.setup();
    renderApp();
    await continueAsGuest(user);

    await user.click(await screen.findByRole('link', { name: 'I Am Afraid' }));
    expect(
      await screen.findByRole('heading', { name: 'Scriptures for Fear' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/\(NIV\)/)).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Actions' }),
      'back',
    );
    expect(
      await screen.findByRole('heading', { name: /scriptural support/i }),
    ).toBeInTheDocument();
  });

  it('moves through scripture list with arrow buttons', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9);
    const user = userEvent.setup();
    renderApp();
    await continueAsGuest(user);

    await user.click(await screen.findByRole('link', { name: 'I Am Afraid' }));
    expect(await screen.findByText('Isaiah 41:10 (NIV)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '← Previous' }));
    expect(await screen.findByText('Psalm 23:4 (NIV)')).toBeInTheDocument();
    randomSpy.mockRestore();
  });

  it('renders about page route', async () => {
    const user = userEvent.setup();
    renderApp(['/about']);
    await continueAsGuest(user);

    expect(
      await screen.findByRole('heading', { name: 'About This Website' }),
    ).toBeInTheDocument();
  });

  it('saved index opens setting help modal', async () => {
    const user = userEvent.setup();
    renderApp(['/saved']);
    await continueAsGuest(user);

    expect(
      await screen.findByRole('heading', { name: 'Saved Scriptures' }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /open setting help/i }),
    );
    expect(
      await screen.findByRole('dialog', { name: 'Saved Scriptures' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/each card is a bible book/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(
      screen.queryByRole('dialog', { name: 'Saved Scriptures' }),
    ).not.toBeInTheDocument();
  });

  it('renders tutorial page route', async () => {
    const user = userEvent.setup();
    renderApp(['/tutorial']);
    await continueAsGuest(user);

    expect(
      await screen.findByRole('heading', { name: 'Tutorial' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /^Getting started$/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /^Troubleshooting$/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        name: /^Recommended next steps$/i,
      }),
    ).toBeInTheDocument();
  });

  it('renders bible reader route with chapter content', async () => {
    const user = userEvent.setup();
    renderApp(['/reader?book=John&chapter=3&translation=KJV']);
    await continueAsGuest(user);

    expect(
      await screen.findByRole('heading', { name: 'Bible Reader' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', {
        name: /for god so loved the world/i,
      }),
    ).toBeInTheDocument();
  });

  it('moves reader chapter forward with next button', async () => {
    const user = userEvent.setup();
    renderApp(['/reader?book=John&chapter=3&translation=KJV']);
    await continueAsGuest(user);

    expect(
      await screen.findByRole('button', {
        name: /for god so loved the world/i,
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next chapter/i }));
    expect(
      await screen.findByRole('button', {
        name: /for god so loved the world/i,
      }),
    ).toBeInTheDocument();
  });

  it('supports reader styles and jump to last place bookmark flow', async () => {
    const user = userEvent.setup();
    renderApp(['/reader?book=John&chapter=3&translation=KJV']);
    await continueAsGuest(user);

    const verseButton = await screen.findByRole('button', {
      name: /for god so loved the world/i,
    });
    await user.click(verseButton);
    await user.click(screen.getByRole('button', { name: 'Bookmark Here' }));
    expect(
      await screen.findByText(/you are bookmarked at john 3:16/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next chapter/i }));
    expect(
      await screen.findByRole('button', {
        name: /for god so loved the world/i,
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /jump to last place/i }),
    );
    expect(
      await screen.findByRole('button', {
        name: /for god so loved the world/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Options' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Reading style' }),
      'standard',
    );
    expect(
      screen.queryByRole('button', {
        name: /john 3:16 for god so loved the world/i,
      }),
    ).not.toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Reading style' }),
      'clean',
    );
    expect(
      screen.queryByText(/john 3:16 for god so loved the world/i),
    ).not.toBeInTheDocument();
  });

  it('supports reader verse actions with note indicator and note editing', async () => {
    const user = userEvent.setup();
    renderApp(['/reader?book=John&chapter=3&translation=KJV']);
    await continueAsGuest(user);
    await user.click(screen.getByRole('button', { name: 'Options' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Reading style' }),
      'verse',
    );
    await user.click(screen.getByRole('button', { name: 'Done' }));

    await user.click(
      await screen.findByRole('button', {
        name: /for god sent not his son into the world to condemn the world/i,
      }),
    );
    await user.click(screen.getByRole('button', { name: /view\/edit note/i }));
    const noteInput = await screen.findByRole('textbox', {
      name: /reader verse note/i,
    });
    expect(await screen.findByText(/saved john 3:17/i)).toBeInTheDocument();
    await user.clear(noteInput);
    await user.type(noteInput, 'Reader note from actions');
    await user.click(screen.getByRole('button', { name: /save note/i }));
    expect(
      await screen.findByText(/saved note for john 3:17/i),
    ).toBeInTheDocument();
    await user.click(
      await screen.findByRole('button', {
        name: /for god sent not his son into the world to condemn the world/i,
      }),
    );
    await user.click(screen.getByRole('button', { name: /view\/edit note/i }));
    expect(
      await screen.findByDisplayValue('Reader note from actions'),
    ).toBeInTheDocument();
  });

  it('shares verse from reader actions with clipboard fallback', async () => {
    const writeText = vi
      .spyOn(globalThis.navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    const share = vi.fn().mockRejectedValue(new Error('share unavailable'));
    Object.defineProperty(globalThis.navigator, 'share', {
      configurable: true,
      value: share,
    });
    const user = userEvent.setup();
    renderApp(['/reader?book=John&chapter=3&translation=KJV']);
    await continueAsGuest(user);
    await user.click(
      await screen.findByRole('button', {
        name: /for god so loved the world/i,
      }),
    );
    await user.click(screen.getByRole('button', { name: /share verse/i }));
    expect(
      await screen.findByText(/share link copied for john 3:16/i),
    ).toBeInTheDocument();
    expect(share).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(String(writeText.mock.calls[0][0])).toContain(
      '/verse?book=John&chapter=3&verse=16&translation=KJV',
    );
    writeText.mockRestore();
  });

  it('renders public shared verse detail route and can open reader', async () => {
    const user = userEvent.setup();
    renderApp(['/verse?book=john&chapter=3&verse=16&translation=kjv']);
    expect(
      await screen.findByRole('heading', { name: 'Shared Verse' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/shared link/i)).toBeInTheDocument();
    expect(await screen.findByText(/john 3:16 \(KJV\)/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/for god so loved the world/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /open in reader/i }));
    await continueAsGuest(user);
    expect(
      await screen.findByRole('heading', { name: 'Bible Reader' }),
    ).toBeInTheDocument();
  });

  it('persists reader comfort settings and supports reset', async () => {
    const user = userEvent.setup();
    const firstRender = renderApp([
      '/reader?book=John&chapter=3&translation=KJV',
    ]);
    await continueAsGuest(user);

    expect(
      await screen.findByRole('heading', { name: 'Bible Reader' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Options' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Theme' }),
      'dark',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Font size' }),
      'lg',
    );
    expect(
      screen.getByRole('checkbox', { name: 'Gentle break reminders' }),
    ).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText(/Eye comfort tip/i)).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('checkbox', { name: 'Gentle break reminders' }),
    );
    firstRender.unmount();

    renderApp(['/reader?book=John&chapter=3&translation=KJV']);
    expect(
      await screen.findByRole('heading', { name: 'Bible Reader' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Options' }));
    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveValue('dark');
    expect(screen.getByRole('combobox', { name: 'Font size' })).toHaveValue(
      'lg',
    );
    expect(
      screen.getByRole('checkbox', { name: 'Gentle break reminders' }),
    ).not.toBeChecked();

    await user.click(
      screen.getByRole('button', { name: /reset reader settings/i }),
    );
    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveValue(
      'sepia',
    );
    expect(screen.getByRole('combobox', { name: 'Font size' })).toHaveValue(
      'md',
    );
    expect(
      screen.getByRole('checkbox', { name: 'Gentle break reminders' }),
    ).toBeChecked();
  });

  it('keeps reader theme classes when app high contrast is enabled', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('high-contrast', 'true');
    renderApp(['/reader?book=John&chapter=3&translation=KJV']);
    await continueAsGuest(user);

    expect(
      await screen.findByRole('heading', { name: 'Bible Reader' }),
    ).toBeInTheDocument();

    const shell = document.querySelector('.min-h-screen.app-high-contrast');
    expect(shell).toBeTruthy();

    const readerRoot = document.querySelector(
      '.reader-root.reader-theme-sepia',
    );
    expect(readerRoot).toBeTruthy();
  });

  it('applies reader reduced-motion class when preference is enabled', async () => {
    const user = userEvent.setup();
    renderApp(['/reader?book=John&chapter=3&translation=KJV']);
    await continueAsGuest(user);

    await user.click(screen.getByRole('button', { name: 'Options' }));
    await user.click(screen.getByRole('checkbox', { name: 'Reduced motion' }));

    expect(
      document.querySelector('.reader-root.reader-reduced-motion'),
    ).toBeTruthy();
  });

  it('combines app text scale with reader route', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('text-scale', 'xl');
    renderApp(['/reader?book=John&chapter=3&translation=KJV']);
    await continueAsGuest(user);

    expect(
      await screen.findByRole('heading', { name: 'Bible Reader' }),
    ).toBeInTheDocument();

    const shell = document.querySelector('.min-h-screen.app-text-scale-xl');
    expect(shell).toBeTruthy();
    expect(document.querySelector('.reader-root')).toBeTruthy();
  });

  it('emits privacy-safe payloads for reader comfort rollout telemetry', async () => {
    const user = userEvent.setup();
    const received: { name: string; payload?: Record<string, unknown> }[] = [];
    function onTelemetry(event: Event) {
      const custom = event as CustomEvent<{
        name: string;
        payload?: Record<string, unknown>;
      }>;
      received.push({
        name: custom.detail.name,
        payload: custom.detail.payload,
      });
    }
    window.addEventListener('app:telemetry', onTelemetry);

    renderApp(['/reader?book=John&chapter=3&translation=KJV']);
    await continueAsGuest(user);

    await user.click(screen.getByRole('button', { name: 'Options' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Theme' }),
      'dark',
    );
    await user.click(
      screen.getByRole('button', { name: /reset reader settings/i }),
    );
    await user.click(screen.getByRole('button', { name: 'Done' }));

    window.removeEventListener('app:telemetry', onTelemetry);

    const comfort = received.filter((e) =>
      [
        'reader_preference_changed',
        'reader_preferences_reset',
        'reader_break_tip_dismissed',
      ].includes(e.name),
    );
    expect(comfort.length).toBeGreaterThan(0);
    for (const evt of comfort) {
      expect(
        isPrivacySafeReaderComfortRolloutPayload(evt.name, evt.payload),
      ).toBe(true);
    }
  });

  it('shows global high contrast hint in reader options', async () => {
    const user = userEvent.setup();
    renderApp(['/reader?book=John&chapter=3&translation=KJV']);
    await continueAsGuest(user);

    await user.click(screen.getByRole('button', { name: 'Options' }));
    expect(
      screen.getByRole('note', { name: /global high contrast hint/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Menu → Display settings/i)).toBeInTheDocument();
  });

  it('opens reader route from emotion scripture full chapter action', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    renderApp();
    await continueAsGuest(user);

    await user.click(await screen.findByRole('link', { name: 'I Am Afraid' }));
    await user.click(
      await screen.findByRole('button', { name: /read full chapter/i }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Bible Reader' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', {
        name: /for god so loved the world/i,
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /back to support verse/i }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Scriptures for Fear' }),
    ).toBeInTheDocument();

    randomSpy.mockRestore();
  });

  it('does not show stale context errors after changing scripture', async () => {
    let contextRequestCount = 0;
    server.use(
      http.get('/api/scripture-context', ({ request }) => {
        contextRequestCount += 1;
        const url = new URL(request.url);
        const reference = url.searchParams.get('reference') ?? '';
        if (contextRequestCount === 1) {
          return HttpResponse.json(
            {
              error: {
                code: 'internal_error',
                message: 'context request failed',
              },
            },
            { status: 500 },
          );
        }
        return HttpResponse.json({
          data: {
            reference,
            chapterReference: reference.split(':')[0] ?? reference,
            summary: 'Recovered context response',
            fullContext: 'Recovered context response',
            sourceName: 'Seeded Study Context',
            sourceUrl: '',
            isFallback: false,
          },
        });
      }),
    );
    const user = userEvent.setup();
    renderApp();
    await continueAsGuest(user);

    await user.click(await screen.findByRole('link', { name: 'I Am Afraid' }));
    await user.click(
      await screen.findByRole('button', { name: 'Learn context' }),
    );
    expect(
      await screen.findByText(/Could not load context right now/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '← Previous' }));
    expect(
      screen.queryByText(/Could not load context right now/i),
    ).not.toBeInTheDocument();
  });

  it('keeps the current scripture when translation changes', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const user = userEvent.setup();
    renderApp();
    await continueAsGuest(user);

    await user.click(await screen.findByRole('link', { name: 'I Am Afraid' }));
    expect(await screen.findByText('Psalm 23:4 (NIV)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next →' }));
    expect(await screen.findByText('Isaiah 41:10 (NIV)')).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /translation/i }),
      'ASV',
    );
    expect(await screen.findByText('Isaiah 41:10 (NIV)')).toBeInTheDocument();

    randomSpy.mockRestore();
  });

  it('shows sign in action inside menu only and uses branded login modal', async () => {
    const user = userEvent.setup();
    renderApp();
    await continueAsGuest(user);

    expect(
      screen.queryByRole('button', { name: 'Sign in' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(
      screen.getByRole('button', { name: /display settings/i }),
    ).toBeInTheDocument();
    const scrollContainer = document.getElementById('overlay-main-menu-scroll');
    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer?.className).toContain('overflow-y-auto');
    await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(
      await screen.findByRole('heading', { name: 'Scripture & Solace' }),
    ).toBeInTheDocument();
  });

  it('mirrors reader theme in Display settings; Cancel restores theme', async () => {
    const user = userEvent.setup();
    renderApp();
    await continueAsGuest(user);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(
      await screen.findByRole('button', { name: /display settings/i }),
    );

    const readingColors = await screen.findByRole('combobox', {
      name: 'Reading colors',
    });
    expect(readingColors).toHaveValue('sepia');

    await user.selectOptions(readingColors, 'dark');
    const stored = JSON.parse(
      window.localStorage.getItem('reader-preferences')!,
    ) as { preferences: { theme: string } };
    expect(stored.preferences.theme).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    const afterCancel = JSON.parse(
      window.localStorage.getItem('reader-preferences')!,
    ) as { preferences: { theme: string } };
    expect(afterCancel.preferences.theme).toBe('sepia');
  });

  it('supports batch save flow and note save on saved verse', async () => {
    const user = userEvent.setup();
    renderApp(['/search']);
    await continueAsGuest(user);
    expect(
      await screen.findByRole('heading', { name: 'Bible Search' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /search verses/i }));
    const saveActionButtons = await screen.findAllByRole('button', {
      name: /save actions/i,
    });
    let groupedSaveCheckbox: HTMLElement | null = null;
    for (const actionButton of saveActionButtons) {
      await user.click(actionButton);
      const candidate = await screen.findByRole('checkbox', {
        name: /select for grouped save/i,
      });
      if (!candidate.hasAttribute('disabled')) {
        groupedSaveCheckbox = candidate;
        break;
      }
      await user.click(screen.getByRole('button', { name: 'Done' }));
    }
    if (!groupedSaveCheckbox) {
      throw new Error('Expected at least one enabled grouped save checkbox');
    }
    const saveActionsDialog = screen.getByRole('dialog', {
      name: /save actions/i,
    });
    await user.click(groupedSaveCheckbox);
    await user.click(
      within(saveActionsDialog).getByRole('button', {
        name: /save selected \(1\)/i,
      }),
    );
    expect(
      await screen.findByText(/selected verses saved/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Done' }));

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(await screen.findByRole('link', { name: 'Saved' }));
    await user.click(await screen.findByRole('link', { name: /john/i }));
    const noteInputs = await screen.findAllByPlaceholderText(
      /add a personal note for this saved scripture/i,
    );
    await user.clear(noteInputs[0]);
    await user.type(noteInputs[0], 'Phase 5 note test');
    await user.click(screen.getAllByRole('button', { name: /save note/i })[0]);
    expect(await screen.findByText(/note saved/i)).toBeInTheDocument();
  });

  it('renders prayer partners hub when signed in', async () => {
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({
          data: {
            isAuthenticated: true,
            userId: 'user-msw-test-1',
            role: 'user',
            displayName: 'MSW Test User',
            avatarUrl: null,
            enabledSocialProviders: ['google'],
          },
        }),
      ),
    );
    renderApp(['/prayer-partners']);
    expect(
      await screen.findByRole('heading', { name: 'Prayer Partners' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/0-day streak/i)).toBeInTheDocument();
  });

  it('confirms prayer partner delete in a modal', async () => {
    const partner = {
      partnerId: 42,
      ownerUserId: 'user-msw-test-1',
      name: 'Modal Delete Partner',
      prayerFocus: 'Testing delete flow',
      imageUrl: null,
      isArchived: false,
      noteCount: 0,
      lastNoteAt: null,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    let deleteCalled = false;
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({
          data: {
            isAuthenticated: true,
            userId: 'user-msw-test-1',
            role: 'user',
            displayName: 'MSW Test User',
            avatarUrl: null,
            enabledSocialProviders: ['google'],
          },
        }),
      ),
      http.get('/api/prayer-partners', () =>
        HttpResponse.json({ data: [partner] }),
      ),
      http.delete('/api/prayer-partners/42', () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderApp(['/prayer-partners']);
    expect(
      await screen.findByRole('heading', { name: 'Prayer Partners' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Modal Delete Partner')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(
      await screen.findByRole('heading', { name: /delete prayer partner/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^delete partner$/i }));
    await screen.findByText(/partner deleted/i);
    expect(deleteCalled).toBe(true);
  });

  it('confirms prayer list delete in a modal', async () => {
    const list = {
      listId: 77,
      ownerUserId: 'user-msw-test-1',
      name: 'Modal Delete List',
      description: 'For delete confirm test',
      isArchived: false,
      sessionCount: 0,
      lastSessionAt: null,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    let deleteCalled = false;
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({
          data: {
            isAuthenticated: true,
            userId: 'user-msw-test-1',
            role: 'user',
            displayName: 'MSW Test User',
            avatarUrl: null,
            enabledSocialProviders: ['google'],
          },
        }),
      ),
      http.get('/api/prayer-lists', () => HttpResponse.json({ data: [list] })),
      http.delete('/api/prayer-lists/77', () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderApp(['/prayer-lists']);
    expect(
      await screen.findByRole('heading', { name: 'Prayer Lists' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Modal Delete List')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(
      await screen.findByRole('heading', { name: /delete prayer list/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^delete list$/i }));
    await screen.findByText(/list deleted/i);
    expect(deleteCalled).toBe(true);
  });

  it('opens prayer lists filters modal when signed in', async () => {
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({
          data: {
            isAuthenticated: true,
            userId: 'user-msw-test-1',
            role: 'user',
            displayName: 'MSW Test User',
            avatarUrl: null,
            enabledSocialProviders: ['google'],
          },
        }),
      ),
    );
    const user = userEvent.setup();
    renderApp(['/prayer-lists']);
    expect(
      await screen.findByRole('heading', { name: 'Prayer Lists' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(
      await screen.findByRole('heading', { name: 'Filter lists' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(
      screen.queryByRole('heading', { name: 'Filter lists' }),
    ).not.toBeInTheDocument();
  });
});
