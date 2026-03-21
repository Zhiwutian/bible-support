import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { resetApiMockState } from './handlers';
import { server } from './server';

beforeAll(() => {
  Object.defineProperty(globalThis.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: () => {},
  });
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async () => {},
    },
  });
  Object.defineProperty(globalThis.navigator, 'share', {
    configurable: true,
    value: undefined,
  });
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  // Ensure each test starts from a clean DOM and clean API mock state.
  cleanup();
  server.resetHandlers();
  resetApiMockState();
  try {
    window.sessionStorage.clear();
    window.localStorage.clear();
  } catch {
    // ignore
  }
});

afterAll(() => {
  server.close();
});
