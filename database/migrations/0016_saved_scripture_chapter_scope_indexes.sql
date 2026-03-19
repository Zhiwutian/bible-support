-- Supports GET /api/saved-scriptures/chapter (owner + translation + book + chapter).
CREATE INDEX "saved_scripture_items_owner_chapter_scope_idx"
  ON "saved_scripture_items" USING btree ("ownerUserId", "translation", "book", "chapter")
  WHERE "ownerUserId" IS NOT NULL;

CREATE INDEX "saved_scripture_items_device_chapter_scope_idx"
  ON "saved_scripture_items" USING btree ("deviceId", "translation", "book", "chapter")
  WHERE "ownerUserId" IS NULL AND "deviceId" IS NOT NULL;
