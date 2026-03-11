ALTER TABLE "saved_scripture_items"
ALTER COLUMN "deviceId" DROP NOT NULL;
--> statement-breakpoint
UPDATE "saved_scripture_items"
SET "deviceId" = null
WHERE "ownerUserId" is not null
  AND "deviceId" like 'user:%';
--> statement-breakpoint
ALTER TABLE "saved_scripture_items"
ADD CONSTRAINT "saved_scripture_items_owner_or_device_check"
CHECK ("ownerUserId" is not null or "deviceId" is not null);
