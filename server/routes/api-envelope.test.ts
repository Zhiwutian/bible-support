import request from 'supertest';
import { Express } from 'express';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@server/services/todo-service.js', () => ({
  readTodos: vi.fn(async () => [
    {
      todoId: 1,
      task: 'mocked todo',
      isCompleted: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  ]),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  removeTodo: vi.fn(),
}));

describe('api envelope', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
    const { createApp } = await import('@server/app.js');
    app = createApp();
  });

  it('returns success envelope for GET /api/todos', async () => {
    const res = await request(app).get('/api/todos').expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({
        todoId: 1,
        task: 'mocked todo',
      }),
    );
    expect(res.body.meta).toEqual(
      expect.objectContaining({ requestId: expect.any(String) }),
    );
  });

  it('returns validation error envelope for bad POST /api/todos payload', async () => {
    const res = await request(app).post('/api/todos').send({}).expect(400);

    expect(res.body.error).toEqual(
      expect.objectContaining({
        code: 'validation_error',
        message: 'request validation failed',
      }),
    );
    expect(res.body.meta).toEqual(
      expect.objectContaining({ requestId: expect.any(String) }),
    );
  });
});
