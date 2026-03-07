import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

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
