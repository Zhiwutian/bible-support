import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ToastProvider } from '@/components/app/ToastProvider';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { AppStateProvider } from '@/state';
import { MemoryRouter } from 'react-router-dom';

expect.extend(toHaveNoViolations);

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

describe('accessibility (axe)', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('Support home has no serious or critical axe violations after guest entry', async () => {
    const user = userEvent.setup();
    const { container } = renderApp();
    await user.click(
      await screen.findByRole('button', { name: /continue as guest/i }),
    );
    await screen.findByRole('heading', { name: /scriptural support/i });

    const result = await axe(container);
    const severe = result.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(severe).toEqual([]);
  });

  it('Search route has no serious or critical axe violations', async () => {
    const user = userEvent.setup();
    const { container } = renderApp(['/search']);
    await user.click(
      await screen.findByRole('button', { name: /continue as guest/i }),
    );
    await screen.findByRole('heading', { name: /bible search/i });

    const result = await axe(container);
    const severe = result.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(severe).toEqual([]);
  });
});
