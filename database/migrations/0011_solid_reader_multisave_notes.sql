ALTER TABLE "saved_scripture_items"
ADD COLUMN "saveGroupId" uuid;
--> statement-breakpoint
ALTER TABLE "saved_scripture_items"
ADD COLUMN "note" text;
--> statement-breakpoint
ALTER TABLE "saved_scripture_items"
ADD CONSTRAINT "saved_scripture_items_note_length_check"
CHECK ("note" is null or char_length("note") <= 4000);
--> statement-breakpoint
CREATE INDEX "saved_scripture_items_save_group_idx"
ON "saved_scripture_items" USING btree ("saveGroupId");
--> statement-breakpoint
CREATE INDEX "saved_scripture_items_owner_group_created_idx"
ON "saved_scripture_items" USING btree ("ownerUserId","saveGroupId","createdAt","savedId");
--> statement-breakpoint
CREATE INDEX "saved_scripture_items_device_group_created_idx"
ON "saved_scripture_items" USING btree ("deviceId","saveGroupId","createdAt","savedId");
