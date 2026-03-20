import jwt from 'jsonwebtoken';
import request from 'supertest';
import type { Express } from 'express';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const readPrayerPartnersMock = vi.fn();
const createPrayerPartnerMock = vi.fn();
const updatePrayerPartnerMock = vi.fn();
const removePrayerPartnerMock = vi.fn();
const readPrayerPartnerNotesMock = vi.fn();
const createPrayerPartnerNoteMock = vi.fn();
const readPrayerListsMock = vi.fn();
const createPrayerListMock = vi.fn();
const readPrayerListMembersMock = vi.fn();
const addPrayerListMemberMock = vi.fn();
const reorderPrayerListMembersMock = vi.fn();
const readPrayerSessionsMock = vi.fn();
const createPrayerSessionMock = vi.fn();

vi.mock('@server/services/prayer-service.js', () => ({
  readPrayerPartners: (...args: unknown[]): unknown =>
    readPrayerPartnersMock(...args),
  readPrayerPartner: vi.fn(),
  createPrayerPartner: (...args: unknown[]): unknown =>
    createPrayerPartnerMock(...args),
  updatePrayerPartner: (...args: unknown[]): unknown =>
    updatePrayerPartnerMock(...args),
  removePrayerPartner: (...args: unknown[]): unknown =>
    removePrayerPartnerMock(...args),
  readPrayerPartnerNotes: (...args: unknown[]): unknown =>
    readPrayerPartnerNotesMock(...args),
  createPrayerPartnerNote: (...args: unknown[]): unknown =>
    createPrayerPartnerNoteMock(...args),
  updatePrayerPartnerNote: vi.fn(),
  removePrayerPartnerNote: vi.fn(),
  readPrayerLists: (...args: unknown[]): unknown =>
    readPrayerListsMock(...args),
  readPrayerList: vi.fn(),
  createPrayerList: (...args: unknown[]): unknown =>
    createPrayerListMock(...args),
  updatePrayerList: vi.fn(),
  removePrayerList: vi.fn(),
  readPrayerListMembers: (...args: unknown[]): unknown =>
    readPrayerListMembersMock(...args),
  addPrayerListMember: (...args: unknown[]): unknown =>
    addPrayerListMemberMock(...args),
  removePrayerListMember: vi.fn(),
  reorderPrayerListMembers: (...args: unknown[]): unknown =>
    reorderPrayerListMembersMock(...args),
  readPrayerSessions: (...args: unknown[]): unknown =>
    readPrayerSessionsMock(...args),
  createPrayerSession: (...args: unknown[]): unknown =>
    createPrayerSessionMock(...args),
}));

describe('prayer routes', () => {
  let app: Express;
  let sessionCookie: string;

  beforeAll(async () => {
    process.env.SESSION_SECRET =
      process.env.SESSION_SECRET ?? 'test-session-secret';
    const { createApp } = await import('@server/app.js');
    app = createApp();
    const sessionToken = jwt.sign(
      { sid: 'test-sid', userId: 'user-test-1' },
      process.env.SESSION_SECRET,
    );
    sessionCookie = `app_session=${sessionToken}`;
  });

  beforeEach(() => {
    readPrayerPartnersMock.mockReset();
    createPrayerPartnerMock.mockReset();
    updatePrayerPartnerMock.mockReset();
    removePrayerPartnerMock.mockReset();
    readPrayerPartnerNotesMock.mockReset();
    createPrayerPartnerNoteMock.mockReset();
    readPrayerListsMock.mockReset();
    createPrayerListMock.mockReset();
    readPrayerListMembersMock.mockReset();
    addPrayerListMemberMock.mockReset();
    reorderPrayerListMembersMock.mockReset();
    readPrayerSessionsMock.mockReset();
    createPrayerSessionMock.mockReset();
  });

  it('requires auth for prayer partners', async () => {
    const res = await request(app).get('/api/prayer-partners').expect(401);
    expect(res.body.error.code).toBe('client_error');
  });

  it('returns prayer partners for authenticated user', async () => {
    readPrayerPartnersMock.mockResolvedValue([
      {
        partnerId: 1,
        ownerUserId: 'user-test-1',
        name: 'Jane',
        prayerFocus: 'Health',
        imageUrl: null,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    const res = await request(app)
      .get('/api/prayer-partners')
      .set('cookie', sessionCookie)
      .expect(200);
    expect(readPrayerPartnersMock).toHaveBeenCalledWith('user-test-1', false);
    expect(res.body.data[0].name).toBe('Jane');
  });

  it('creates a prayer partner', async () => {
    createPrayerPartnerMock.mockResolvedValue({
      partnerId: 11,
      ownerUserId: 'user-test-1',
      name: 'John',
      prayerFocus: 'Job search',
      imageUrl: null,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await request(app)
      .post('/api/prayer-partners')
      .set('cookie', sessionCookie)
      .send({ name: 'John', prayerFocus: 'Job search' })
      .expect(201);
    expect(res.body.data.partnerId).toBe(11);
  });

  it('lists prayer lists', async () => {
    readPrayerListsMock.mockResolvedValue([
      {
        listId: 9,
        ownerUserId: 'user-test-1',
        name: 'Bible Study',
        description: null,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    const res = await request(app)
      .get('/api/prayer-lists')
      .set('cookie', sessionCookie)
      .expect(200);
    expect(readPrayerListsMock).toHaveBeenCalledWith('user-test-1', false);
    expect(res.body.data[0].name).toBe('Bible Study');
  });

  it('adds a prayer list member', async () => {
    addPrayerListMemberMock.mockResolvedValue({
      prayerListMemberId: 1,
      listId: 9,
      partnerId: 11,
      position: 1,
      createdAt: new Date().toISOString(),
    });
    const res = await request(app)
      .post('/api/prayer-lists/9/members')
      .set('cookie', sessionCookie)
      .send({ partnerId: 11, position: 1 })
      .expect(201);
    expect(res.body.data.position).toBe(1);
  });

  it('reorders prayer list members', async () => {
    reorderPrayerListMembersMock.mockResolvedValue([
      {
        prayerListMemberId: 1,
        listId: 9,
        partnerId: 11,
        position: 1,
        createdAt: new Date().toISOString(),
      },
    ]);
    const res = await request(app)
      .patch('/api/prayer-lists/9/members/reorder')
      .set('cookie', sessionCookie)
      .send({ partnerIdsInOrder: [11] })
      .expect(200);
    expect(res.body.data[0].partnerId).toBe(11);
  });

  it('creates a prayer session for a list', async () => {
    createPrayerSessionMock.mockResolvedValue({
      prayerSessionId: 2,
      ownerUserId: 'user-test-1',
      listId: 9,
      listNameSnapshot: 'Bible Study',
      note: 'Prayed before meeting',
      createdAt: new Date().toISOString(),
    });
    const res = await request(app)
      .post('/api/prayer-lists/9/sessions')
      .set('cookie', sessionCookie)
      .send({ note: 'Prayed before meeting' })
      .expect(201);
    expect(res.body.data.prayerSessionId).toBe(2);
  });
});
