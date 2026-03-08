ALTER TABLE "todos" ALTER COLUMN "isCompleted" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "todos"
ALTER COLUMN "isCompleted"
SET DATA TYPE boolean
USING CASE
  WHEN "isCompleted"::text IN ('1', 'true', 't', 'yes', 'y', 'on') THEN true
  ELSE false
END;--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "isCompleted" SET DEFAULT false;