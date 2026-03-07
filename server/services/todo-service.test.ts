import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDrizzleDb } from '@server/db/drizzle.js';
import { readTodos } from './todo-service.js';

vi.mock('@server/db/drizzle.js', () => ({
  getDrizzleDb: vi.fn(),
}));

describe('todo-service', () => {
  const getDrizzleDbMock = vi.mocked(getDrizzleDb);

  beforeEach(() => {
    getDrizzleDbMock.mockReset();
  });

  it('throws a 503 ClientError when database is not configured', async () => {
    getDrizzleDbMock.mockReturnValue(null);

    await expect(readTodos()).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining('database is not configured'),
    });
  });

  it('returns todos from the database query', async () => {
    const rows = [
      {
        todoId: 1,
        task: 'test',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const orderBy = vi.fn(async () => rows);
    const from = vi.fn(() => ({ orderBy }));
    const select = vi.fn(() => ({ from }));
    getDrizzleDbMock.mockReturnValue({ select } as never);

    const result = await readTodos();

    expect(result).toEqual(rows);
  });
});
