import {
  FormProvider,
  SubmitHandler,
  useFormContext,
  UseFormReturn,
} from 'react-hook-form';
import { Button, Input } from '@/components/ui';
import { CreateTodoFormValues } from './create-todo-schema';

type FieldsProps = {
  isSubmitting: boolean;
};

/**
 * Render create-todo form fields using React Hook Form context.
 */
function CreateTodoFields({ isSubmitting }: FieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateTodoFormValues>();

  return (
    <>
      <Input
        className="flex-1"
        aria-label="New todo task"
        placeholder="Add a task"
        disabled={isSubmitting}
        {...register('task')}
      />
      <Button type="submit" disabled={isSubmitting}>
        Add Todo
      </Button>
      {errors.task?.message && (
        <p className="col-span-2 text-sm text-red-700">{errors.task.message}</p>
      )}
    </>
  );
}

type Props = {
  methods: UseFormReturn<CreateTodoFormValues>;
  onSubmit: SubmitHandler<CreateTodoFormValues>;
};

/**
 * Create-todo form wrapper using FormProvider for nested field access.
 */
export function CreateTodoForm({ methods, onSubmit }: Props) {
  return (
    <FormProvider {...methods}>
      <form
        className="mb-6 grid grid-cols-[1fr_auto] gap-3"
        onSubmit={methods.handleSubmit(onSubmit)}>
        <CreateTodoFields isSubmitting={methods.formState.isSubmitting} />
      </form>
    </FormProvider>
  );
}
