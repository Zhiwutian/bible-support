CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE "users" (
	"userId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"authAccountId" serial PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"provider" text NOT NULL,
	"providerSubject" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_accounts_provider_subject_unique" UNIQUE("provider","providerSubject")
);
--> statement-breakpoint
ALTER TABLE "auth_accounts"
ADD CONSTRAINT "auth_accounts_userId_users_userId_fk"
FOREIGN KEY ("userId") REFERENCES "public"."users"("userId")
ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "saved_scripture_items"
ADD COLUMN "ownerUserId" uuid;
--> statement-breakpoint
ALTER TABLE "saved_scripture_items"
ADD CONSTRAINT "saved_scripture_items_ownerUserId_users_userId_fk"
FOREIGN KEY ("ownerUserId") REFERENCES "public"."users"("userId")
ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "auth_accounts_user_idx"
ON "auth_accounts" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX "saved_scripture_items_owner_user_idx"
ON "saved_scripture_items" USING btree ("ownerUserId");
--> statement-breakpoint
CREATE INDEX "saved_scripture_items_owner_created_sort_idx"
ON "saved_scripture_items" USING btree ("ownerUserId","createdAt","savedId");
--> statement-breakpoint
CREATE UNIQUE INDEX "saved_scripture_items_owner_reference_unique"
ON "saved_scripture_items" USING btree ("ownerUserId","translation","book","chapter","verseStart","verseEnd")
WHERE "ownerUserId" is not null;
