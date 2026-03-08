import { desc, eq, sql } from 'drizzle-orm';
import { todos } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import { requireDb } from './require-db.js';

export type TodoRecord = typeof todos.$inferSelect;

/** Return all todos in newest-first order. */
export async function readTodos(): Promise<TodoRecord[]> {
  const db = requireDb();
  return db.select().from(todos).orderBy(desc(todos.todoId));
}

/** Create a new todo from a task label. */
export async function createTodo(task: string): Promise<TodoRecord> {
  const db = requireDb();
  const [createdTodo] = await db.insert(todos).values({ task }).returning();

  return createdTodo;
}

/** Update completion state for a single todo. */
export async function updateTodo(
  todoId: number,
  isCompleted: boolean,
): Promise<TodoRecord> {
  const db = requireDb();
  const [updatedTodo] = await db
    .update(todos)
    .set({ isCompleted, updatedAt: sql`now()` })
    .where(eq(todos.todoId, todoId))
    .returning();

  if (!updatedTodo) throw new ClientError(404, 'todo not found');
  return updatedTodo;
}

/** Delete a todo by id. */
export async function removeTodo(todoId: number): Promise<void> {
  const db = requireDb();
  const [removedTodo] = await db
    .delete(todos)
    .where(eq(todos.todoId, todoId))
    .returning({ todoId: todos.todoId });

  if (!removedTodo) throw new ClientError(404, 'todo not found');
}
