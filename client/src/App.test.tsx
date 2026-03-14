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
      await screen.findByRole('heading', { name: /how are you feeling/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Fear')).toBeInTheDocument();
    expect(await screen.findByText('Anger')).toBeInTheDocument();
  });

  it('navigates to emotion scripture viewer and back', async () => {
    const user = userEvent.setup();
    renderApp();
    await continueAsGuest(user);

    await user.click(await screen.findByRole('link', { name: 'Fear' }));
    expect(
      await screen.findByRole('heading', { name: 'Scriptures for Fear' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/\(NIV\)/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(
      await screen.findByRole('heading', { name: /how are you feeling/i }),
    ).toBeInTheDocument();
  });

  it('moves through scripture list with arrow buttons', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9);
    const user = userEvent.setup();
    renderApp();
    await continueAsGuest(user);

    await user.click(await screen.findByRole('link', { name: 'Fear' }));
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

    await user.click(await screen.findByRole('link', { name: 'Fear' }));
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
});
