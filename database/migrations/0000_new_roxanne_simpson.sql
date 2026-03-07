CREATE TABLE "todos" (
	"todoId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "todos_todoId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"task" text NOT NULL,
	"isCompleted" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
