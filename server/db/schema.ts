import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const emotions = pgTable(
  'emotions',
  {
    emotionId: serial('emotionId').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emotionsSlugUnique: uniqueIndex('emotions_slug_unique').on(table.slug),
    emotionsSlugLowercaseCheck: check(
      'emotions_slug_lowercase_check',
      sql`${table.slug} = lower(${table.slug})`,
    ),
  }),
);

export const scriptures = pgTable(
  'scriptures',
  {
    scriptureId: serial('scriptureId').primaryKey(),
    emotionId: integer('emotionId')
      .notNull()
      .references(() => emotions.emotionId, { onDelete: 'cascade' }),
    reference: text('reference').notNull(),
    verseText: text('verseText').notNull(),
    translation: text('translation').notNull().default('NIV'),
    displayOrder: integer('displayOrder').notNull(),
    contextChapterReference: text('contextChapterReference')
      .notNull()
      .default(''),
    contextSummary: text('contextSummary').notNull().default(''),
    fullContext: text('fullContext').notNull().default(''),
    contextSourceName: text('contextSourceName')
      .notNull()
      .default('Seeded Study Context'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    scripturesEmotionDisplayOrderUnique: uniqueIndex(
      'scriptures_emotion_display_order_unique',
    ).on(table.emotionId, table.displayOrder),
    scripturesReferenceIndex: index('scriptures_reference_idx').on(
      table.reference,
    ),
    scripturesDisplayOrderPositiveCheck: check(
      'scriptures_display_order_positive_check',
      sql`${table.displayOrder} > 0`,
    ),
  }),
);

export const scriptureVerses = pgTable(
  'scripture_verses',
  {
    verseId: serial('verseId').primaryKey(),
    translation: text('translation').notNull().default('KJV'),
    book: text('book').notNull(),
    chapter: integer('chapter').notNull(),
    verse: integer('verse').notNull(),
    reference: text('reference').notNull(),
    verseText: text('verseText').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    scriptureVersesUnique: uniqueIndex('scripture_verses_unique').on(
      table.translation,
      table.book,
      table.chapter,
      table.verse,
    ),
    /* Reader/search filter by translation first; unique index below also supports (translation, book, chapter, verse). */
    scriptureVersesBookChapterVerseIdx: index(
      'scripture_verses_book_chapter_verse_idx',
    ).on(table.book, table.chapter, table.verse),
    scriptureVersesReferenceIdx: index('scripture_verses_reference_idx').on(
      table.reference,
    ),
    scriptureVersesTextFtsIdx: index('scripture_verses_text_fts_idx').using(
      'gin',
      sql`to_tsvector('simple', ${table.verseText})`,
    ),
    scriptureVersesChapterPositiveCheck: check(
      'scripture_verses_chapter_positive_check',
      sql`${table.chapter} > 0`,
    ),
    scriptureVersesVersePositiveCheck: check(
      'scripture_verses_verse_positive_check',
      sql`${table.verse} > 0`,
    ),
  }),
);

export const users = pgTable(
  'users',
  {
    userId: uuid('userId').defaultRandom().primaryKey(),
    role: text('role').notNull().default('user'),
    displayName: text('displayName'),
    avatarUrl: text('avatarUrl'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    usersRoleCheck: check(
      'users_role_check',
      sql`${table.role} in ('user', 'admin')`,
    ),
    usersDisplayNameLengthCheck: check(
      'users_display_name_length_check',
      sql`${table.displayName} is null or char_length(${table.displayName}) <= 120`,
    ),
    usersAvatarUrlLengthCheck: check(
      'users_avatar_url_length_check',
      sql`${table.avatarUrl} is null or char_length(${table.avatarUrl}) <= 2048`,
    ),
  }),
);

export const authAccounts = pgTable(
  'auth_accounts',
  {
    authAccountId: serial('authAccountId').primaryKey(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerSubject: text('providerSubject').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    authAccountsProviderSubjectUnique: uniqueIndex(
      'auth_accounts_provider_subject_unique',
    ).on(table.provider, table.providerSubject),
    authAccountsUserIdx: index('auth_accounts_user_idx').on(table.userId),
  }),
);

export const authAuditEvents = pgTable(
  'auth_audit_events',
  {
    authAuditEventId: serial('authAuditEventId').primaryKey(),
    userId: uuid('userId').references(() => users.userId, {
      onDelete: 'set null',
    }),
    provider: text('provider').notNull(),
    eventType: text('eventType').notNull(),
    outcome: text('outcome').notNull(),
    reason: text('reason'),
    message: text('message'),
    ip: text('ip'),
    userAgent: text('userAgent'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    authAuditEventsCreatedAtIdx: index('auth_audit_events_created_at_idx').on(
      table.createdAt,
    ),
    authAuditEventsUserIdx: index('auth_audit_events_user_idx').on(
      table.userId,
    ),
    authAuditEventsTypeIdx: index('auth_audit_events_type_idx').on(
      table.eventType,
    ),
    /* Event type strings must match `AUTH_AUDIT_EVENT_TYPES` in `shared/auth-audit-contracts.ts`. */
    authAuditEventsEventTypeCheck: check(
      'auth_audit_events_event_type_check',
      sql`${table.eventType} in (
        'login_start',
        'callback_success',
        'callback_failure',
        'logout',
        'admin_role_change'
      )`,
    ),
    authAuditEventsOutcomeCheck: check(
      'auth_audit_events_outcome_check',
      sql`${table.outcome} in ('success', 'failure')`,
    ),
  }),
);

export const savedScriptureItems = pgTable(
  'saved_scripture_items',
  {
    savedId: serial('savedId').primaryKey(),
    deviceId: text('deviceId'),
    ownerUserId: uuid('ownerUserId').references(() => users.userId, {
      onDelete: 'cascade',
    }),
    label: text('label'),
    saveGroupId: uuid('saveGroupId'),
    note: text('note'),
    translation: text('translation').notNull(),
    book: text('book').notNull(),
    chapter: integer('chapter').notNull(),
    verseStart: integer('verseStart').notNull(),
    verseEnd: integer('verseEnd').notNull(),
    reference: text('reference').notNull(),
    sourceMode: text('sourceMode').notNull().default('local'),
    queryText: text('queryText'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    savedScriptureItemsDeviceIdx: index('saved_scripture_items_device_idx').on(
      table.deviceId,
    ),
    savedScriptureItemsOwnerUserIdx: index(
      'saved_scripture_items_owner_user_idx',
    ).on(table.ownerUserId),
    savedScriptureItemsDeviceCreatedSortIdx: index(
      'saved_scripture_items_device_created_sort_idx',
    ).on(table.deviceId, table.createdAt, table.savedId),
    savedScriptureItemsOwnerCreatedSortIdx: index(
      'saved_scripture_items_owner_created_sort_idx',
    ).on(table.ownerUserId, table.createdAt, table.savedId),
    savedScriptureItemsSaveGroupIdx: index(
      'saved_scripture_items_save_group_idx',
    ).on(table.saveGroupId),
    savedScriptureItemsOwnerGroupCreatedIdx: index(
      'saved_scripture_items_owner_group_created_idx',
    ).on(table.ownerUserId, table.saveGroupId, table.createdAt, table.savedId),
    savedScriptureItemsDeviceGroupCreatedIdx: index(
      'saved_scripture_items_device_group_created_idx',
    ).on(table.deviceId, table.saveGroupId, table.createdAt, table.savedId),
    savedScriptureItemsOwnerChapterScopeIdx: index(
      'saved_scripture_items_owner_chapter_scope_idx',
    )
      .on(table.ownerUserId, table.translation, table.book, table.chapter)
      .where(sql`${table.ownerUserId} is not null`),
    savedScriptureItemsDeviceChapterScopeIdx: index(
      'saved_scripture_items_device_chapter_scope_idx',
    )
      .on(table.deviceId, table.translation, table.book, table.chapter)
      .where(
        sql`${table.ownerUserId} is null and ${table.deviceId} is not null`,
      ),
    savedScriptureItemsUnique: uniqueIndex(
      'saved_scripture_items_device_reference_unique',
    )
      .on(
        table.deviceId,
        table.translation,
        table.book,
        table.chapter,
        table.verseStart,
        table.verseEnd,
      )
      .where(sql`${table.ownerUserId} is null`),
    savedScriptureItemsOwnerUnique: uniqueIndex(
      'saved_scripture_items_owner_reference_unique',
    )
      .on(
        table.ownerUserId,
        table.translation,
        table.book,
        table.chapter,
        table.verseStart,
        table.verseEnd,
      )
      .where(sql`${table.ownerUserId} is not null`),
    savedScriptureItemsChapterPositiveCheck: check(
      'saved_scripture_items_chapter_positive_check',
      sql`${table.chapter} > 0`,
    ),
    savedScriptureItemsVerseStartPositiveCheck: check(
      'saved_scripture_items_verse_start_positive_check',
      sql`${table.verseStart} > 0`,
    ),
    savedScriptureItemsVerseEndPositiveCheck: check(
      'saved_scripture_items_verse_end_positive_check',
      sql`${table.verseEnd} > 0`,
    ),
    savedScriptureItemsVerseRangeCheck: check(
      'saved_scripture_items_verse_range_check',
      sql`${table.verseEnd} >= ${table.verseStart}`,
    ),
    savedScriptureItemsOwnerOrDeviceCheck: check(
      'saved_scripture_items_owner_or_device_check',
      sql`${table.ownerUserId} is not null or ${table.deviceId} is not null`,
    ),
    /* Values must match Zod `sourceMode` on POST/PATCH saved-scripture APIs. */
    savedScriptureItemsSourceModeCheck: check(
      'saved_scripture_items_source_mode_check',
      sql`${table.sourceMode} in ('local', 'remote')`,
    ),
    savedScriptureItemsNoteLengthCheck: check(
      'saved_scripture_items_note_length_check',
      sql`${table.note} is null or char_length(${table.note}) <= 4000`,
    ),
  }),
);

export const readerState = pgTable(
  'reader_state',
  {
    userId: uuid('userId')
      .primaryKey()
      .references(() => users.userId, { onDelete: 'cascade' }),
    preferences: jsonb('preferences'),
    bookmarkBook: text('bookmarkBook'),
    bookmarkChapter: integer('bookmarkChapter'),
    bookmarkVerse: integer('bookmarkVerse'),
    bookmarkTranslation: text('bookmarkTranslation'),
    bookmarkScrollOffset: integer('bookmarkScrollOffset'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    readerStateBookmarkChapterPositiveCheck: check(
      'reader_state_bookmark_chapter_positive_check',
      sql`${table.bookmarkChapter} is null or ${table.bookmarkChapter} > 0`,
    ),
    readerStateBookmarkVersePositiveCheck: check(
      'reader_state_bookmark_verse_positive_check',
      sql`${table.bookmarkVerse} is null or ${table.bookmarkVerse} > 0`,
    ),
    readerStateBookmarkScrollOffsetCheck: check(
      'reader_state_bookmark_scroll_offset_check',
      sql`${table.bookmarkScrollOffset} is null or ${table.bookmarkScrollOffset} >= 0`,
    ),
    readerStateBookmarkTupleCheck: check(
      'reader_state_bookmark_tuple_check',
      sql`(
        ${table.bookmarkBook} is null and
        ${table.bookmarkChapter} is null and
        ${table.bookmarkVerse} is null and
        ${table.bookmarkTranslation} is null and
        ${table.bookmarkScrollOffset} is null
      ) or (
        ${table.bookmarkBook} is not null and
        ${table.bookmarkChapter} is not null and
        ${table.bookmarkVerse} is not null and
        ${table.bookmarkTranslation} is not null and
        ${table.bookmarkScrollOffset} is not null
      )`,
    ),
    /* Allowed codes must match `SUPPORTED_SCRIPTURE_TRANSLATIONS` in `shared/scripture-search-contracts.ts`. */
    readerStateBookmarkTranslationCheck: check(
      'reader_state_bookmark_translation_check',
      sql`${table.bookmarkTranslation} is null or ${table.bookmarkTranslation} in ('KJV', 'ASV', 'WEB')`,
    ),
  }),
);

export const prayerPartners = pgTable(
  'prayer_partners',
  {
    partnerId: serial('partnerId').primaryKey(),
    ownerUserId: uuid('ownerUserId')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    prayerFocus: text('prayerFocus').notNull(),
    imageUrl: text('imageUrl'),
    isArchived: boolean('isArchived').notNull().default(false),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    prayerPartnersOwnerUserIdx: index('prayer_partners_owner_user_idx').on(
      table.ownerUserId,
    ),
    prayerPartnersOwnerArchivedCreatedIdx: index(
      'prayer_partners_owner_archived_created_idx',
    ).on(table.ownerUserId, table.isArchived, table.createdAt, table.partnerId),
    prayerPartnersNameLengthCheck: check(
      'prayer_partners_name_length_check',
      sql`char_length(${table.name}) <= 120`,
    ),
    prayerPartnersPrayerFocusLengthCheck: check(
      'prayer_partners_prayer_focus_length_check',
      sql`char_length(${table.prayerFocus}) <= 4000`,
    ),
    prayerPartnersImageUrlLengthCheck: check(
      'prayer_partners_image_url_length_check',
      sql`${table.imageUrl} is null or char_length(${table.imageUrl}) <= 2048`,
    ),
  }),
);

export const prayerLists = pgTable(
  'prayer_lists',
  {
    listId: serial('listId').primaryKey(),
    ownerUserId: uuid('ownerUserId')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    isArchived: boolean('isArchived').notNull().default(false),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    prayerListsOwnerUserIdx: index('prayer_lists_owner_user_idx').on(
      table.ownerUserId,
    ),
    prayerListsOwnerArchivedCreatedIdx: index(
      'prayer_lists_owner_archived_created_idx',
    ).on(table.ownerUserId, table.isArchived, table.createdAt, table.listId),
    prayerListsNameLengthCheck: check(
      'prayer_lists_name_length_check',
      sql`char_length(${table.name}) <= 120`,
    ),
    prayerListsDescriptionLengthCheck: check(
      'prayer_lists_description_length_check',
      sql`${table.description} is null or char_length(${table.description}) <= 2000`,
    ),
  }),
);

export const prayerListMembers = pgTable(
  'prayer_list_members',
  {
    prayerListMemberId: serial('prayerListMemberId').primaryKey(),
    listId: integer('listId')
      .notNull()
      .references(() => prayerLists.listId, { onDelete: 'cascade' }),
    partnerId: integer('partnerId')
      .notNull()
      .references(() => prayerPartners.partnerId, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    prayerListMembersListIdx: index('prayer_list_members_list_idx').on(
      table.listId,
    ),
    prayerListMembersPartnerIdx: index('prayer_list_members_partner_idx').on(
      table.partnerId,
    ),
    prayerListMembersListPartnerUnique: uniqueIndex(
      'prayer_list_members_list_partner_unique',
    ).on(table.listId, table.partnerId),
    prayerListMembersListPositionUnique: uniqueIndex(
      'prayer_list_members_list_position_unique',
    ).on(table.listId, table.position),
    prayerListMembersPositionPositiveCheck: check(
      'prayer_list_members_position_positive_check',
      sql`${table.position} > 0`,
    ),
  }),
);

export const prayerSessions = pgTable(
  'prayer_sessions',
  {
    prayerSessionId: serial('prayerSessionId').primaryKey(),
    ownerUserId: uuid('ownerUserId')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    listId: integer('listId').references(() => prayerLists.listId, {
      onDelete: 'set null',
    }),
    listNameSnapshot: text('listNameSnapshot').notNull(),
    note: text('note'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    prayerSessionsOwnerCreatedIdx: index(
      'prayer_sessions_owner_created_idx',
    ).on(table.ownerUserId, table.createdAt, table.prayerSessionId),
    prayerSessionsListCreatedIdx: index('prayer_sessions_list_created_idx').on(
      table.listId,
      table.createdAt,
      table.prayerSessionId,
    ),
    prayerSessionsListNameSnapshotLengthCheck: check(
      'prayer_sessions_list_name_snapshot_length_check',
      sql`char_length(${table.listNameSnapshot}) <= 120`,
    ),
    prayerSessionsNoteLengthCheck: check(
      'prayer_sessions_note_length_check',
      sql`${table.note} is null or char_length(${table.note}) <= 4000`,
    ),
  }),
);

export const prayerPartnerNotes = pgTable(
  'prayer_partner_notes',
  {
    prayerPartnerNoteId: serial('prayerPartnerNoteId').primaryKey(),
    ownerUserId: uuid('ownerUserId')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    partnerId: integer('partnerId').references(() => prayerPartners.partnerId, {
      onDelete: 'set null',
    }),
    partnerNameSnapshot: text('partnerNameSnapshot').notNull(),
    note: text('note').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    prayerPartnerNotesOwnerCreatedIdx: index(
      'prayer_partner_notes_owner_created_idx',
    ).on(table.ownerUserId, table.createdAt, table.prayerPartnerNoteId),
    prayerPartnerNotesPartnerCreatedIdx: index(
      'prayer_partner_notes_partner_created_idx',
    ).on(table.partnerId, table.createdAt, table.prayerPartnerNoteId),
    prayerPartnerNotesPartnerNameSnapshotLengthCheck: check(
      'prayer_partner_notes_partner_name_snapshot_length_check',
      sql`char_length(${table.partnerNameSnapshot}) <= 120`,
    ),
    prayerPartnerNotesNoteLengthCheck: check(
      'prayer_partner_notes_note_length_check',
      sql`char_length(${table.note}) <= 4000`,
    ),
  }),
);
