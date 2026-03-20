import type {
  AddPrayerListMemberRequest,
  CreatePrayerListRequest,
  CreatePrayerSessionRequest,
  PrayerList,
  PrayerListMember,
  PrayerPartner,
  PrayerSession,
  ReorderPrayerListMembersRequest,
  UpdatePrayerListRequest,
} from '@shared/prayer-contracts';
import { fetchJson, fetchNoContent } from '@/lib';

export type PrayerListMemberWithPartner = PrayerListMember & {
  partner: PrayerPartner;
};

function withArchivedQuery(path: string, includeArchived: boolean): string {
  if (!includeArchived) return path;
  const params = new URLSearchParams({ includeArchived: 'true' });
  return `${path}?${params.toString()}`;
}

export async function readPrayerLists(
  includeArchived = false,
): Promise<PrayerList[]> {
  return fetchJson<PrayerList[]>(
    withArchivedQuery('/api/prayer-lists', includeArchived),
  );
}

export async function readPrayerList(listId: number): Promise<PrayerList> {
  return fetchJson<PrayerList>(`/api/prayer-lists/${listId}`);
}

export async function createPrayerList(
  payload: CreatePrayerListRequest,
): Promise<PrayerList> {
  return fetchJson<PrayerList>('/api/prayer-lists', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePrayerList(
  listId: number,
  payload: UpdatePrayerListRequest,
): Promise<PrayerList> {
  return fetchJson<PrayerList>(`/api/prayer-lists/${listId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePrayerList(listId: number): Promise<void> {
  return fetchNoContent(`/api/prayer-lists/${listId}`, {
    method: 'DELETE',
  });
}

export async function readPrayerListMembers(
  listId: number,
): Promise<PrayerListMemberWithPartner[]> {
  return fetchJson<PrayerListMemberWithPartner[]>(
    `/api/prayer-lists/${listId}/members`,
  );
}

export async function addPrayerListMember(
  listId: number,
  payload: AddPrayerListMemberRequest,
): Promise<PrayerListMember> {
  return fetchJson<PrayerListMember>(`/api/prayer-lists/${listId}/members`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deletePrayerListMember(
  listId: number,
  partnerId: number,
): Promise<void> {
  return fetchNoContent(`/api/prayer-lists/${listId}/members/${partnerId}`, {
    method: 'DELETE',
  });
}

export async function reorderPrayerListMembers(
  listId: number,
  payload: ReorderPrayerListMembersRequest,
): Promise<PrayerListMember[]> {
  return fetchJson<PrayerListMember[]>(
    `/api/prayer-lists/${listId}/members/reorder`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export async function readPrayerListSessions(
  listId: number,
): Promise<PrayerSession[]> {
  return fetchJson<PrayerSession[]>(`/api/prayer-lists/${listId}/sessions`);
}

export async function createPrayerListSession(
  listId: number,
  payload: CreatePrayerSessionRequest,
): Promise<PrayerSession> {
  return fetchJson<PrayerSession>(`/api/prayer-lists/${listId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
