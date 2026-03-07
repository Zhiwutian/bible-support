import { useCallback, useEffect, useState } from 'react';
import {
  createTodo as createTodoApi,
  deleteTodo as deleteTodoApi,
  readHelloMessage,
  readTodos,
  Todo,
  toggleTodo as toggleTodoApi,
} from './todo-api';

/**
 * Encapsulate todo and related page data loading/mutation logic.
 */
export function useTodos() {
  const [serverMessage, setServerMessage] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  /** Load todo list from API and update local state. */
  const loadTodos = useCallback(async () => setTodos(await readTodos()), []);

  useEffect(() => {
    /** Load hello message and todos on first render. */
    async function loadInitialData() {
      setIsLoading(true);
      setError('');
      try {
        setServerMessage(await readHelloMessage());
        await loadTodos();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [loadTodos]);

  /** Create a new todo and prepend it to local state. */
  async function createTodo(task: string): Promise<Todo | null> {
    setError('');
    try {
      const createdTodo = await createTodoApi(task);
      setTodos((current) => [createdTodo, ...current]);
      return createdTodo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
      return null;
    }
  }

  /** Toggle a todo completion state and update local cache. */
  async function toggleTodo(todo: Todo): Promise<void> {
    setError('');
    try {
      const updatedTodo = await toggleTodoApi(todo);
      setTodos((current) =>
        current.map((item) =>
          item.todoId === updatedTodo.todoId ? updatedTodo : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    }
  }

  /** Delete a todo by id and remove it from local state. */
  async function deleteTodo(todoId: number): Promise<void> {
    setError('');
    try {
      await deleteTodoApi(todoId);
      setTodos((current) => current.filter((item) => item.todoId !== todoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    }
  }

  return {
    serverMessage,
    todos,
    isLoading,
    error,
    createTodo,
    toggleTodo,
    deleteTodo,
  };
}
