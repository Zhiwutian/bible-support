import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useToast } from '@/components/app/toast-context';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SectionHeader,
} from '@/components/ui';
import { CreateTodoForm } from '@/features/todos/CreateTodoForm';
import {
  createTodoSchema,
  CreateTodoFormValues,
} from '@/features/todos/create-todo-schema';
import { type Todo } from '@/features/todos/todo-api';
import { useTodos } from '@/features/todos/useTodos';
import { TodoFilter, useAppDispatch, useAppState } from '@/state';

/**
 * Render the Todo page and demonstrate full CRUD calls against `/api/todos`.
 */
export function TodosPage() {
  const { showToast } = useToast();
  const previousErrorRef = useRef<string>('');
  const { todoFilter } = useAppState();
  const dispatch = useAppDispatch();
  const {
    createTodo,
    deleteTodo,
    error,
    isLoading,
    serverMessage,
    todos,
    toggleTodo,
  } = useTodos();
  const completedCount = todos.filter((todo) => todo.isCompleted).length;
  const createTodoForm = useForm<CreateTodoFormValues>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: { task: '' },
  });

  useEffect(() => {
    if (!error) {
      previousErrorRef.current = '';
      return;
    }
    if (error === previousErrorRef.current) return;
    previousErrorRef.current = error;
    showToast({
      title: 'Request failed',
      description: error,
      variant: 'error',
    });
  }, [error, showToast]);

  /** Create a new todo from validated form input. */
  const handleCreateTodo: SubmitHandler<CreateTodoFormValues> = async (
    values,
  ) => {
    const createdTodo = await createTodo(values.task);
    if (createdTodo) {
      createTodoForm.reset();
      showToast({
        title: 'Todo created',
        description: `Added "${createdTodo.task}"`,
        variant: 'success',
      });
    }
  };

  /** Toggle a todo's completed state. */
  async function handleToggleTodo(todo: Todo) {
    await toggleTodo(todo);
  }

  /** Delete a todo by id and remove it from local state. */
  async function handleDeleteTodo(todoId: number) {
    await deleteTodo(todoId);
  }

  /** Return todos filtered by the current global todo filter. */
  function getFilteredTodos(filter: TodoFilter): Todo[] {
    if (filter === 'active') return todos.filter((todo) => !todo.isCompleted);
    if (filter === 'completed') return todos.filter((todo) => todo.isCompleted);
    return todos;
  }

  const visibleTodos = getFilteredTodos(todoFilter);

  return (
    <>
      <SectionHeader
        title="Todo Starter"
        description={`Server says: ${serverMessage || '...'}`}
        metadata={
          <>
            <Badge>{todos.length} total</Badge>
            <Badge variant="success">{completedCount} completed</Badge>
          </>
        }
      />

      <CreateTodoForm methods={createTodoForm} onSubmit={handleCreateTodo} />

      <div className="mb-4 flex gap-2">
        <Button
          variant="ghost"
          className={todoFilter === 'all' ? 'bg-slate-200' : undefined}
          onClick={() => dispatch({ type: 'todoFilter/set', payload: 'all' })}>
          All
        </Button>
        <Button
          variant="ghost"
          className={todoFilter === 'active' ? 'bg-slate-200' : undefined}
          onClick={() =>
            dispatch({ type: 'todoFilter/set', payload: 'active' })
          }>
          Active
        </Button>
        <Button
          variant="ghost"
          className={todoFilter === 'completed' ? 'bg-slate-200' : undefined}
          onClick={() =>
            dispatch({ type: 'todoFilter/set', payload: 'completed' })
          }>
          Completed
        </Button>
      </div>

      {isLoading && <p className="text-sm text-slate-600">Loading todos...</p>}
      {!isLoading && visibleTodos.length === 0 && (
        <EmptyState
          title={todos.length === 0 ? 'No todos yet' : 'No matching todos'}
          description={
            todos.length === 0
              ? 'Add your first task to start tracking work.'
              : 'Try a different filter or update todo completion states.'
          }
        />
      )}
      <Card>
        <ul
          className="m-0 list-none divide-y divide-slate-200 p-0"
          aria-label="Todo list">
          {visibleTodos.map((todo) => (
            <li
              key={todo.todoId}
              className="flex items-center justify-between gap-4 px-4 py-3">
              <label className="flex items-center gap-3 text-sm text-slate-800">
                <input
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  type="checkbox"
                  checked={todo.isCompleted}
                  onChange={() => handleToggleTodo(todo)}
                />
                <span
                  className={
                    todo.isCompleted ? 'text-slate-500 line-through' : undefined
                  }>
                  {todo.task}
                </span>
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTodo(todo.todoId)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
