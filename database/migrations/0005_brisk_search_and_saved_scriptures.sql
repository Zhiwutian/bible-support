CREATE TABLE "scripture_verses" (
	"verseId" serial PRIMARY KEY NOT NULL,
	"translation" text DEFAULT 'KJV' NOT NULL,
	"book" text NOT NULL,
	"chapter" integer NOT NULL,
	"verse" integer NOT NULL,
	"reference" text NOT NULL,
	"verseText" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scripture_verses_chapter_positive_check" CHECK ("scripture_verses"."chapter" > 0),
	CONSTRAINT "scripture_verses_verse_positive_check" CHECK ("scripture_verses"."verse" > 0)
);
--> statement-breakpoint
CREATE TABLE "saved_scripture_items" (
	"savedId" serial PRIMARY KEY NOT NULL,
	"deviceId" text NOT NULL,
	"label" text,
	"translation" text NOT NULL,
	"book" text NOT NULL,
	"chapter" integer NOT NULL,
	"verseStart" integer NOT NULL,
	"verseEnd" integer NOT NULL,
	"reference" text NOT NULL,
	"sourceMode" text DEFAULT 'local' NOT NULL,
	"queryText" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_scripture_items_chapter_positive_check" CHECK ("saved_scripture_items"."chapter" > 0),
	CONSTRAINT "saved_scripture_items_verse_start_positive_check" CHECK ("saved_scripture_items"."verseStart" > 0),
	CONSTRAINT "saved_scripture_items_verse_end_positive_check" CHECK ("saved_scripture_items"."verseEnd" > 0),
	CONSTRAINT "saved_scripture_items_verse_range_check" CHECK ("saved_scripture_items"."verseEnd" >= "saved_scripture_items"."verseStart")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "scripture_verses_unique" ON "scripture_verses" USING btree ("translation","book","chapter","verse");
--> statement-breakpoint
CREATE INDEX "scripture_verses_book_chapter_verse_idx" ON "scripture_verses" USING btree ("book","chapter","verse");
--> statement-breakpoint
CREATE INDEX "scripture_verses_reference_idx" ON "scripture_verses" USING btree ("reference");
--> statement-breakpoint
CREATE INDEX "scripture_verses_text_fts_idx" ON "scripture_verses" USING gin (to_tsvector('simple', "verseText"));
--> statement-breakpoint
CREATE INDEX "saved_scripture_items_device_idx" ON "saved_scripture_items" USING btree ("deviceId");
--> statement-breakpoint
CREATE UNIQUE INDEX "saved_scripture_items_device_reference_unique" ON "saved_scripture_items" USING btree ("deviceId","translation","book","chapter","verseStart","verseEnd");
