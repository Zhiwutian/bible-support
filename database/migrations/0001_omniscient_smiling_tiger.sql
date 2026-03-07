ALTER TABLE "todos" ALTER COLUMN "todoId" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "todoId" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "isCompleted" SET DATA TYPE boolean;