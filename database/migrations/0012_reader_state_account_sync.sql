CREATE TABLE "reader_state" (
  "userId" uuid PRIMARY KEY NOT NULL,
  "preferences" jsonb,
  "bookmarkBook" text,
  "bookmarkChapter" integer,
  "bookmarkVerse" integer,
  "bookmarkTranslation" text,
  "bookmarkScrollOffset" integer,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reader_state"
ADD CONSTRAINT "reader_state_userId_users_userId_fk"
FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reader_state"
ADD CONSTRAINT "reader_state_bookmark_chapter_positive_check"
CHECK ("bookmarkChapter" is null or "bookmarkChapter" > 0);
--> statement-breakpoint
ALTER TABLE "reader_state"
ADD CONSTRAINT "reader_state_bookmark_verse_positive_check"
CHECK ("bookmarkVerse" is null or "bookmarkVerse" > 0);
--> statement-breakpoint
ALTER TABLE "reader_state"
ADD CONSTRAINT "reader_state_bookmark_scroll_offset_check"
CHECK ("bookmarkScrollOffset" is null or "bookmarkScrollOffset" >= 0);
--> statement-breakpoint
ALTER TABLE "reader_state"
ADD CONSTRAINT "reader_state_bookmark_tuple_check"
CHECK ((
  "bookmarkBook" is null and
  "bookmarkChapter" is null and
  "bookmarkVerse" is null and
  "bookmarkTranslation" is null and
  "bookmarkScrollOffset" is null
) or (
  "bookmarkBook" is not null and
  "bookmarkChapter" is not null and
  "bookmarkVerse" is not null and
  "bookmarkTranslation" is not null and
  "bookmarkScrollOffset" is not null
));
