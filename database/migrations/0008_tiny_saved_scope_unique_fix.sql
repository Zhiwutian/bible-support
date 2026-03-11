DROP INDEX IF EXISTS "saved_scripture_items_device_reference_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "saved_scripture_items_device_reference_unique"
ON "saved_scripture_items" USING btree ("deviceId","translation","book","chapter","verseStart","verseEnd")
WHERE "ownerUserId" is null;
