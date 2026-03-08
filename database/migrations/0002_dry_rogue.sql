CREATE TABLE "emotions" (
	"emotionId" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scriptures" (
	"scriptureId" serial PRIMARY KEY NOT NULL,
	"emotionId" integer NOT NULL,
	"reference" text NOT NULL,
	"verseText" text NOT NULL,
	"translation" text DEFAULT 'NIV' NOT NULL,
	"displayOrder" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scriptures" ADD CONSTRAINT "scriptures_emotionId_emotions_emotionId_fk" FOREIGN KEY ("emotionId") REFERENCES "public"."emotions"("emotionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "emotions_slug_unique" ON "emotions" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "scriptures_emotion_display_order_unique" ON "scriptures" USING btree ("emotionId","displayOrder");