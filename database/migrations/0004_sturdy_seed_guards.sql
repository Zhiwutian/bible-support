ALTER TABLE "emotions"
ADD CONSTRAINT "emotions_slug_lowercase_check"
CHECK ("slug" = lower("slug"));
--> statement-breakpoint
ALTER TABLE "scriptures"
ADD CONSTRAINT "scriptures_display_order_positive_check"
CHECK ("displayOrder" > 0);
--> statement-breakpoint
CREATE INDEX "scriptures_reference_idx" ON "scriptures" USING btree ("reference");
