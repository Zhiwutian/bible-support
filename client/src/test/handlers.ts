import { http, HttpResponse } from 'msw';

type Todo = {
  todoId: number;
  task: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

let nextTodoId = 2;
let todos: Todo[] = [makeTodo(1, 'Wire up first feature', false)];

/** Build a deterministic todo object for MSW mock state. */
function makeTodo(todoId: number, task: string, isCompleted: boolean): Todo {
  const timestamp = new Date().toISOString();
  return {
    todoId,
    task,
    isCompleted,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Reset in-memory API state between tests to avoid cross-test coupling. */
export function resetApiMockState() {
  nextTodoId = 2;
  todos = [makeTodo(1, 'Wire up first feature', false)];
}

export const handlers = [
  http.get('/api/hello', () => {
    return HttpResponse.json({ data: { message: 'Hello, World!' } });
  }),
  http.get('/api/todos', () => {
    return HttpResponse.json({ data: todos });
  }),
  http.post('/api/todos', async ({ request }) => {
    const body = (await request.json()) as { task?: string };
    if (!body.task || !body.task.trim()) {
      return HttpResponse.json(
        {
          error: {
            code: 'validation_error',
            message: 'task is required',
          },
        },
        { status: 400 },
      );
    }
    const newTodo = makeTodo(nextTodoId++, body.task.trim(), false);
    todos = [newTodo, ...todos];
    return HttpResponse.json({ data: newTodo }, { status: 201 });
  }),
  http.patch('/api/todos/:todoId', async ({ params, request }) => {
    const todoId = Number(params.todoId);
    const body = (await request.json()) as { isCompleted?: boolean };
    const todo = todos.find((item) => item.todoId === todoId);
    if (!todo) {
      return HttpResponse.json(
        {
          error: {
            code: 'client_error',
            message: 'todo not found',
          },
        },
        { status: 404 },
      );
    }
    if (typeof body.isCompleted !== 'boolean') {
      return HttpResponse.json(
        {
          error: {
            code: 'validation_error',
            message: 'isCompleted must be a boolean',
          },
        },
        { status: 400 },
      );
    }
    const updatedTodo = {
      ...todo,
      isCompleted: body.isCompleted,
      updatedAt: new Date().toISOString(),
    };
    todos = todos.map((item) => (item.todoId === todoId ? updatedTodo : item));
    return HttpResponse.json({ data: updatedTodo });
  }),
  http.delete('/api/todos/:todoId', ({ params }) => {
    const todoId = Number(params.todoId);
    const todo = todos.find((item) => item.todoId === todoId);
    if (!todo) {
      return HttpResponse.json(
        {
          error: {
            code: 'client_error',
            message: 'todo not found',
          },
        },
        { status: 404 },
      );
    }
    todos = todos.filter((item) => item.todoId !== todoId);
    return new HttpResponse(null, { status: 204 });
  }),
];
