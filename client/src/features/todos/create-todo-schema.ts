import { z } from 'zod';

export const createTodoSchema = z.object({
  task: z.string().trim().min(1, 'Task is required'),
});

export type CreateTodoFormValues = z.infer<typeof createTodoSchema>;
