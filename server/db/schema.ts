import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Starter table to demonstrate Drizzle schema + migrations.
export const todos = pgTable('todos', {
  todoId: serial('todoId').primaryKey(),
  task: text('task').notNull(),
  isCompleted: boolean('isCompleted').notNull().default(false),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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
    savedScriptureItemsNoteLengthCheck: check(
      'saved_scripture_items_note_length_check',
      sql`${table.note} is null or char_length(${table.note}) <= 4000`,
    ),
  }),
);
