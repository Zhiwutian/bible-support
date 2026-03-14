import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@/components/app/ToastProvider';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import App from './App';
import { AppStateProvider } from '@/state';
import { MemoryRouter } from 'react-router-dom';
import { server } from '@/test/server';

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

  it('navigates to emotion scripture viewer and back', async () => {
    const user = userEvent.setup();
    renderApp();
    await continueAsGuest(user);

    await user.click(await screen.findByRole('link', { name: 'I Am Afraid' }));
    expect(
      await screen.findByRole('heading', { name: 'Scriptures for Fear' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/\(NIV\)/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
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

  it('renders bible reader route with chapter content', async () => {
    const user = userEvent.setup();
    renderApp(['/reader?book=John&chapter=3&translation=KJV']);
    await continueAsGuest(user);

    expect(
      await screen.findByRole('heading', { name: 'Bible Reader' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/John 3:16 For God so loved the world/i),
    ).toBeInTheDocument();
  });

  it('moves reader chapter forward with next button', async () => {
    const user = userEvent.setup();
    renderApp(['/reader?book=John&chapter=3&translation=KJV']);
    await continueAsGuest(user);

    expect(
      await screen.findByText(/John 3:16 For God so loved the world/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next chapter/i }));
    expect(
      await screen.findByText(/John 4:16 For God so loved the world/i),
    ).toBeInTheDocument();
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

  it('supports batch save flow and note save on saved verse', async () => {
    const user = userEvent.setup();
    renderApp(['/search']);
    await continueAsGuest(user);

    await user.click(screen.getByRole('button', { name: /search verses/i }));
    const selectBoxes = await screen.findAllByRole('checkbox', {
      name: /select for grouped save/i,
    });
    const enabledCheckbox = selectBoxes.find(
      (checkbox) => !checkbox.hasAttribute('disabled'),
    );
    expect(enabledCheckbox).toBeDefined();
    await user.click(enabledCheckbox!);
    await user.click(
      screen.getByRole('button', { name: /save selected \(1\)/i }),
    );
    expect(
      await screen.findByText(/saved selected verses/i),
    ).toBeInTheDocument();

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
});
