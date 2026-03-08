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
