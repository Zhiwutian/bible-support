ALTER TABLE "scriptures" ADD COLUMN "contextChapterReference" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "scriptures" ADD COLUMN "contextSummary" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "scriptures" ADD COLUMN "fullContext" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "scriptures" ADD COLUMN "contextSourceName" text DEFAULT 'Seeded Study Context' NOT NULL;