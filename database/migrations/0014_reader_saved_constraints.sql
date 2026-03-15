alter table "saved_scripture_items"
  add constraint "saved_scripture_items_source_mode_check"
  check ("sourceMode" in ('local', 'remote')) not valid;

alter table "reader_state"
  add constraint "reader_state_bookmark_translation_check"
  check ("bookmarkTranslation" is null or "bookmarkTranslation" in ('KJV', 'ASV', 'WEB')) not valid;
