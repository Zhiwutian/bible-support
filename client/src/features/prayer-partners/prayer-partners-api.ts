import type {
  CreatePrayerPartnerNoteRequest,
  CreatePrayerPartnerRequest,
  PrayerPartner,
  PrayerPartnerNote,
  UpdatePrayerPartnerNoteRequest,
  UpdatePrayerPartnerRequest,
} from '@shared/prayer-contracts';
import { fetchJson, fetchNoContent } from '@/lib';

function withArchivedQuery(path: string, includeArchived: boolean): string {
  if (!includeArchived) return path;
  const params = new URLSearchParams({ includeArchived: 'true' });
  return `${path}?${params.toString()}`;
}

export async function readPrayerPartners(
  includeArchived = false,
): Promise<PrayerPartner[]> {
  return fetchJson<PrayerPartner[]>(
    withArchivedQuery('/api/prayer-partners', includeArchived),
  );
}

export async function readPrayerPartner(
  partnerId: number,
): Promise<PrayerPartner> {
  return fetchJson<PrayerPartner>(`/api/prayer-partners/${partnerId}`);
}

export async function createPrayerPartner(
  payload: CreatePrayerPartnerRequest,
): Promise<PrayerPartner> {
  return fetchJson<PrayerPartner>('/api/prayer-partners', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePrayerPartner(
  partnerId: number,
  payload: UpdatePrayerPartnerRequest,
): Promise<PrayerPartner> {
  return fetchJson<PrayerPartner>(`/api/prayer-partners/${partnerId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePrayerPartner(partnerId: number): Promise<void> {
  return fetchNoContent(`/api/prayer-partners/${partnerId}`, {
    method: 'DELETE',
  });
}

export async function readPrayerPartnerNotes(
  partnerId: number,
): Promise<PrayerPartnerNote[]> {
  return fetchJson<PrayerPartnerNote[]>(
    `/api/prayer-partners/${partnerId}/notes`,
  );
}

export async function createPrayerPartnerNote(
  partnerId: number,
  payload: CreatePrayerPartnerNoteRequest,
): Promise<PrayerPartnerNote> {
  return fetchJson<PrayerPartnerNote>(
    `/api/prayer-partners/${partnerId}/notes`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function updatePrayerPartnerNote(
  partnerId: number,
  noteId: number,
  payload: UpdatePrayerPartnerNoteRequest,
): Promise<PrayerPartnerNote> {
  return fetchJson<PrayerPartnerNote>(
    `/api/prayer-partners/${partnerId}/notes/${noteId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export async function deletePrayerPartnerNote(
  partnerId: number,
  noteId: number,
): Promise<void> {
  return fetchNoContent(`/api/prayer-partners/${partnerId}/notes/${noteId}`, {
    method: 'DELETE',
  });
}
