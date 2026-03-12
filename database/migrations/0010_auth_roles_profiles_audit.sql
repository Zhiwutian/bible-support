ALTER TABLE "users"
ADD COLUMN "role" text DEFAULT 'user' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users"
ADD COLUMN "displayName" text;
--> statement-breakpoint
ALTER TABLE "users"
ADD COLUMN "avatarUrl" text;
--> statement-breakpoint
ALTER TABLE "users"
ADD CONSTRAINT "users_role_check"
CHECK ("role" in ('user', 'admin'));
--> statement-breakpoint
ALTER TABLE "users"
ADD CONSTRAINT "users_display_name_length_check"
CHECK ("displayName" is null or char_length("displayName") <= 120);
--> statement-breakpoint
ALTER TABLE "users"
ADD CONSTRAINT "users_avatar_url_length_check"
CHECK ("avatarUrl" is null or char_length("avatarUrl") <= 2048);
--> statement-breakpoint
CREATE TABLE "auth_audit_events" (
  "authAuditEventId" serial PRIMARY KEY NOT NULL,
  "userId" uuid,
  "provider" text NOT NULL,
  "eventType" text NOT NULL,
  "outcome" text NOT NULL,
  "reason" text,
  "message" text,
  "ip" text,
  "userAgent" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "auth_audit_events_event_type_check"
    CHECK ("eventType" in ('login_start', 'callback_success', 'callback_failure', 'logout', 'admin_role_change')),
  CONSTRAINT "auth_audit_events_outcome_check"
    CHECK ("outcome" in ('success', 'failure'))
);
--> statement-breakpoint
ALTER TABLE "auth_audit_events"
ADD CONSTRAINT "auth_audit_events_userId_users_userId_fk"
FOREIGN KEY ("userId") REFERENCES "public"."users"("userId")
ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "auth_audit_events_created_at_idx"
ON "auth_audit_events" USING btree ("createdAt");
--> statement-breakpoint
CREATE INDEX "auth_audit_events_user_idx"
ON "auth_audit_events" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX "auth_audit_events_type_idx"
ON "auth_audit_events" USING btree ("eventType");
