import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import {
  LAST_READER_LOCATION_KEY,
  LAST_READER_LOCATION_LS_KEY,
} from '@/features/reader/last-reader-location';
import { ReaderNavLinkButton } from './ReaderNavLinkButton';

describe('ReaderNavLinkButton', () => {
  afterEach(() => {
    try {
      window.sessionStorage.clear();
      window.localStorage.clear();
    } catch {
      // ignore
    }
  });

  it('points to /reader when no last location is stored', () => {
    render(
      <MemoryRouter>
        <ReaderNavLinkButton>Reader</ReaderNavLinkButton>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /reader/i });
    expect(link).toHaveAttribute('href', '/reader');
  });

  it('uses session last-reader query in href', () => {
    window.sessionStorage.setItem(
      LAST_READER_LOCATION_KEY,
      JSON.stringify({
        book: 'Ruth',
        chapter: 2,
        translation: 'KJV',
      }),
    );
    render(
      <MemoryRouter>
        <ReaderNavLinkButton>Reader</ReaderNavLinkButton>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /reader/i });
    expect(link.getAttribute('href')).toContain('book=Ruth');
    expect(link.getAttribute('href')).toContain('chapter=2');
    expect(link.getAttribute('href')).toContain('translation=KJV');
  });

  it('uses localStorage last-reader when session is empty', () => {
    window.localStorage.setItem(
      LAST_READER_LOCATION_LS_KEY,
      JSON.stringify({
        book: 'Jonah',
        chapter: 1,
        translation: 'WEB',
      }),
    );
    render(
      <MemoryRouter>
        <ReaderNavLinkButton>Reader</ReaderNavLinkButton>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /reader/i });
    expect(link.getAttribute('href')).toContain('book=Jonah');
    expect(link.getAttribute('href')).toContain('translation=WEB');
  });
});
