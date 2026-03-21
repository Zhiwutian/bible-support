export type PrayerPartner = {
  partnerId: number;
  ownerUserId: string;
  name: string;
  prayerFocus: string;
  imageUrl: string | null;
  isArchived: boolean;
  noteCount?: number;
  lastNoteAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PrayerList = {
  listId: number;
  ownerUserId: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  sessionCount?: number;
  lastSessionAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PrayerListMember = {
  prayerListMemberId: number;
  listId: number;
  partnerId: number;
  position: number;
  createdAt: string;
};

export type PrayerSession = {
  prayerSessionId: number;
  ownerUserId: string;
  listId: number | null;
  listNameSnapshot: string;
  note: string | null;
  createdAt: string;
};

export type PrayerPartnerNote = {
  prayerPartnerNoteId: number;
  ownerUserId: string;
  partnerId: number | null;
  partnerNameSnapshot: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePrayerPartnerRequest = {
  name: string;
  prayerFocus: string;
  imageUrl?: string | null;
};

export type UpdatePrayerPartnerRequest = Partial<CreatePrayerPartnerRequest> & {
  isArchived?: boolean;
};

export type CreatePrayerListRequest = {
  name: string;
  description?: string | null;
};

export type UpdatePrayerListRequest = Partial<CreatePrayerListRequest> & {
  isArchived?: boolean;
};

export type AddPrayerListMemberRequest = {
  partnerId: number;
  position?: number;
};

export type ReorderPrayerListMembersRequest = {
  partnerIdsInOrder: number[];
};

export type CreatePrayerSessionRequest = {
  note?: string | null;
};

export type CreatePrayerPartnerNoteRequest = {
  note: string;
};

export type UpdatePrayerPartnerNoteRequest = {
  note: string;
};

/** Consecutive prayer days are based on UTC calendar days of list prayer sessions. */
export type PrayerStreakInsight = {
  currentDays: number;
  longestDays: number;
  /** Most recent UTC date (YYYY-MM-DD) with a session, if any. */
  lastPrayedDate: string | null;
};

export type PrayerReminderSettings = {
  enabled: boolean;
  hour: number | null;
  minute: number | null;
  timezone: string | null;
};

export type PrayerInsightsResponse = {
  streak: PrayerStreakInsight;
  reminder: PrayerReminderSettings;
};

export type UpdatePrayerReminderSettingsRequest = {
  reminderEnabled?: boolean;
  reminderHour?: number;
  reminderMinute?: number;
  reminderTimezone?: string | null;
};
