-- Validate constraints added as NOT VALID in 0014_reader_saved_constraints.sql.
-- Fails if existing rows violate checks; fix data first, then re-run migrate.
ALTER TABLE "saved_scripture_items"
  VALIDATE CONSTRAINT "saved_scripture_items_source_mode_check";

ALTER TABLE "reader_state"
  VALIDATE CONSTRAINT "reader_state_bookmark_translation_check";
