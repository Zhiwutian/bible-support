import { afterEach, describe, expect, it, vi } from 'vitest';
import { authMiddleware } from './authorization-middleware.js';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

type PartialRequest = {
  get: (name: string) => string | undefined;
  user?: { userId: number };
};

describe('authMiddleware', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('throws when Authorization header is missing', () => {
    const req: PartialRequest = {
      get: () => undefined,
    };
    const next = vi.fn();

    expect(() =>
      authMiddleware(req as never, {} as never, next as never),
    ).toThrow('authentication required');
    expect(next).not.toHaveBeenCalled();
  });

  it('throws when Authorization header is malformed', () => {
    const req: PartialRequest = {
      get: () => 'Token abc123',
    };
    const next = vi.fn();

    expect(() =>
      authMiddleware(req as never, {} as never, next as never),
    ).toThrow('authentication required');
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts valid bearer token format and calls next', async () => {
    const jwt = await import('jsonwebtoken');
    vi.mocked(jwt.default.verify).mockReturnValue({ userId: 42 } as never);
    const req: PartialRequest = {
      get: () => 'Bearer abc123',
    };
    const next = vi.fn();

    authMiddleware(req as never, {} as never, next as never);

    expect(jwt.default.verify).toHaveBeenCalledWith(
      'abc123',
      expect.any(String),
    );
    expect(req.user).toEqual({ userId: 42 });
    expect(next).toHaveBeenCalledOnce();
  });
});
