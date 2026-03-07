import {
  type ApiErrorEnvelope,
  type ApiSuccessEnvelope,
} from '@shared/api-contracts';
import { getApiErrorMessage } from '@/lib';

export type Todo = {
  todoId: number;
  task: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Fetch JSON from an API endpoint and throw on non-2xx responses.
 */
async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as ApiErrorEnvelope | null;
    const message = getApiErrorMessage(response.status, errorBody);
    throw new Error(message);
  }
  const responseBody = (await response.json()) as ApiSuccessEnvelope<T>;
  return responseBody.data;
}

/** Read starter hello message from backend. */
export async function readHelloMessage(): Promise<string> {
  const helloData = await fetchJson<{ message: string }>('/api/hello');
  return helloData.message;
}

/** Read all todos from backend API. */
export async function readTodos(): Promise<Todo[]> {
  return fetchJson<Todo[]>('/api/todos');
}

/** Create a todo with the provided task text. */
export async function createTodo(task: string): Promise<Todo> {
  return fetchJson<Todo>('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task }),
  });
}

/** Toggle a todo completion value server-side. */
export async function toggleTodo(todo: Todo): Promise<Todo> {
  return fetchJson<Todo>(`/api/todos/${todo.todoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isCompleted: !todo.isCompleted }),
  });
}

/** Delete a todo by identifier. */
export async function deleteTodo(todoId: number): Promise<void> {
  const response = await fetch(`/api/todos/${todoId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as ApiErrorEnvelope | null;
    const message = getApiErrorMessage(response.status, errorBody);
    throw new Error(message);
  }
}
