CREATE INDEX "saved_scripture_items_device_created_sort_idx"
ON "saved_scripture_items" USING btree ("deviceId","createdAt","savedId");
