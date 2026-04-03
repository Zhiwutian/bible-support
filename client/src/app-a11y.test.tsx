import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ToastProvider } from '@/components/app/ToastProvider';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { AppStateProvider, PreferredTranslationProvider } from '@/state';
import { MemoryRouter } from 'react-router-dom';

expect.extend(toHaveNoViolations);

function renderApp(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <AppStateProvider>
          <PreferredTranslationProvider>
            <App />
          </PreferredTranslationProvider>
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

async function expectNoSeriousOrCriticalViolations(container: HTMLElement) {
  const result = await axe(container);
  const severe = result.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(severe).toEqual([]);
}

describe('accessibility (axe)', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('Support home has no serious or critical axe violations after guest entry', async () => {
    const user = userEvent.setup();
    const { container } = renderApp();
    await continueAsGuest(user);
    await screen.findByRole('heading', { name: /scriptural support/i });

    await expectNoSeriousOrCriticalViolations(container);
  });

  it('Search route has no serious or critical axe violations', async () => {
    const user = userEvent.setup();
    const { container } = renderApp(['/search']);
    await continueAsGuest(user);
    await screen.findByRole('heading', { name: /bible search/i });

    await expectNoSeriousOrCriticalViolations(container);
  });

  it('Reader route has no serious or critical axe violations', async () => {
    const user = userEvent.setup();
    const { container } = renderApp([
      '/reader?book=John&chapter=3&translation=KJV',
    ]);
    await continueAsGuest(user);
    await screen.findByRole('heading', { name: 'Bible Reader' });
    await screen.findByRole('button', {
      name: /for god so loved the world/i,
    });

    await expectNoSeriousOrCriticalViolations(container);
  });

  it('Tutorial route has no serious or critical axe violations', async () => {
    const user = userEvent.setup();
    const { container } = renderApp(['/tutorial']);
    await continueAsGuest(user);
    await screen.findByRole('heading', { name: 'Tutorial' });
    await screen.findByRole('heading', { name: /^Getting started$/i });

    await expectNoSeriousOrCriticalViolations(container);
  });
});
