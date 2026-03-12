import jwt from 'jsonwebtoken';
import request from 'supertest';
import type { Express } from 'express';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientError } from '@server/lib/client-error.js';

const listUsersMock = vi.fn();
const listAuthEventsMock = vi.fn();
const updateUserRoleWithSafeguardsMock = vi.fn();
const readUserRoleByIdMock = vi.fn();

vi.mock('@server/services/admin-service.js', () => ({
  listUsers: (...args: unknown[]): unknown => listUsersMock(...args),
  listAuthEvents: (...args: unknown[]): unknown => listAuthEventsMock(...args),
  updateUserRoleWithSafeguards: (...args: unknown[]): unknown =>
    updateUserRoleWithSafeguardsMock(...args),
  readUserRoleById: (...args: unknown[]): unknown =>
    readUserRoleByIdMock(...args),
}));

describe('admin api routes', () => {
  let app: Express;
  let adminSessionCookie: string;
  let userSessionCookie: string;

  beforeAll(async () => {
    process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'test-token-secret';
    process.env.SESSION_SECRET =
      process.env.SESSION_SECRET ?? 'test-session-secret';
    const { createApp } = await import('@server/app.js');
    app = createApp();
    const adminSession = jwt.sign(
      { sid: 'sid-admin', userId: 'admin-user-id' },
      process.env.SESSION_SECRET,
    );
    adminSessionCookie = `app_session=${adminSession}`;
    const userSession = jwt.sign(
      { sid: 'sid-user', userId: 'normal-user-id' },
      process.env.SESSION_SECRET,
    );
    userSessionCookie = `app_session=${userSession}`;
  });

  beforeEach(() => {
    listUsersMock.mockReset();
    listAuthEventsMock.mockReset();
    updateUserRoleWithSafeguardsMock.mockReset();
    readUserRoleByIdMock.mockReset();
  });

  it('requires authentication for admin users list', async () => {
    await request(app).get('/api/admin/users').expect(401);
  });

  it('requires admin role for admin users list', async () => {
    readUserRoleByIdMock.mockResolvedValue('user');
    await request(app)
      .get('/api/admin/users')
      .set('cookie', userSessionCookie)
      .expect(403);
  });

  it('returns paginated users for admin session', async () => {
    readUserRoleByIdMock.mockResolvedValue('admin');
    listUsersMock.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    const res = await request(app)
      .get('/api/admin/users')
      .set('cookie', adminSessionCookie)
      .expect(200);
    expect(listUsersMock).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(res.body.data.pagination).toEqual({
      page: 1,
      pageSize: 20,
      total: 0,
    });
  });

  it('caps admin users pageSize to max contract value', async () => {
    readUserRoleByIdMock.mockResolvedValue('admin');
    listUsersMock.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      pageSize: 100,
    });
    await request(app)
      .get('/api/admin/users?page=2&pageSize=1000')
      .set('cookie', adminSessionCookie)
      .expect(200);
    expect(listUsersMock).toHaveBeenCalledWith({ page: 2, pageSize: 100 });
  });

  it('requires role change reason for admin role updates', async () => {
    readUserRoleByIdMock.mockResolvedValue('admin');
    await request(app)
      .patch('/api/admin/users/22222222-2222-4222-8222-222222222222/role')
      .set('cookie', adminSessionCookie)
      .send({ role: 'user' })
      .expect(400);
  });

  it('returns conflict from last-admin invariant checks', async () => {
    readUserRoleByIdMock.mockResolvedValue('admin');
    updateUserRoleWithSafeguardsMock.mockRejectedValue(
      new ClientError(409, 'at least one admin must remain'),
    );
    const res = await request(app)
      .patch('/api/admin/users/22222222-2222-4222-8222-222222222222/role')
      .set('cookie', adminSessionCookie)
      .send({ role: 'user', reason: 'handoff complete' })
      .expect(409);
    expect(res.body.error.message).toContain('at least one admin');
  });

  it('returns paginated auth events for admin session', async () => {
    readUserRoleByIdMock.mockResolvedValue('admin');
    listAuthEventsMock.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    const res = await request(app)
      .get('/api/admin/auth-events')
      .set('cookie', adminSessionCookie)
      .expect(200);
    expect(res.body.data.pagination).toEqual({
      page: 1,
      pageSize: 20,
      total: 0,
    });
  });

  it('applies role changes immediately on subsequent requests', async () => {
    readUserRoleByIdMock
      .mockResolvedValueOnce('admin')
      .mockResolvedValueOnce('user');
    listUsersMock.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });

    await request(app)
      .get('/api/admin/users')
      .set('cookie', adminSessionCookie)
      .expect(200);

    await request(app)
      .get('/api/admin/users')
      .set('cookie', adminSessionCookie)
      .expect(403);
  });
});
