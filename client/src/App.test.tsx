import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@/components/app/ToastProvider';
import { describe, expect, it } from 'vitest';
import App from './App';
import { AppStateProvider } from '@/state';
import { MemoryRouter } from 'react-router-dom';

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

describe('App', () => {
  it('renders server message and initial todos', async () => {
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'Todo Starter' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Server says: Hello, World!'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Wire up first feature'),
    ).toBeInTheDocument();
  });

  it('creates, toggles, and deletes a todo', async () => {
    const user = userEvent.setup();
    renderApp();

    const taskInput = await screen.findByLabelText('New todo task');
    await user.type(taskInput, 'Build todo feature');
    await user.click(screen.getByRole('button', { name: 'Add Todo' }));

    expect(await screen.findByText('Build todo feature')).toBeInTheDocument();

    const todoCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(todoCheckbox);
    expect(todoCheckbox).toBeChecked();

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(screen.queryByText('Build todo feature')).not.toBeInTheDocument();
  });

  it('renders about page route', async () => {
    renderApp(['/about']);

    expect(
      await screen.findByRole('heading', { name: 'About This Starter' }),
    ).toBeInTheDocument();
  });
});
