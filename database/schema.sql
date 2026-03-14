set client_min_messages to warning;

-- DANGER: this is NOT how to do it in the real world.
-- `drop schema` INSTANTLY ERASES EVERYTHING.
drop schema "public" cascade;

create schema "public";
create extension if not exists "pgcrypto";

create table "todos" (
  "todoId" serial primary key,
  "task" text not null,
  "isCompleted" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table "emotions" (
  "emotionId" serial primary key,
  "slug" text not null unique check ("slug" = lower("slug")),
  "name" text not null,
  "description" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table "scriptures" (
  "scriptureId" serial primary key,
  "emotionId" integer not null references "emotions"("emotionId") on delete cascade,
  "reference" text not null,
  "verseText" text not null,
  "translation" text not null default 'NIV',
  "displayOrder" integer not null check ("displayOrder" > 0),
  "contextChapterReference" text not null default '',
  "contextSummary" text not null default '',
  "fullContext" text not null default '',
  "contextSourceName" text not null default 'Seeded Study Context',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("emotionId", "displayOrder")
);

create index "scriptures_reference_idx" on "scriptures" ("reference");

create table "scripture_verses" (
  "verseId" serial primary key,
  "translation" text not null default 'KJV',
  "book" text not null,
  "chapter" integer not null check ("chapter" > 0),
  "verse" integer not null check ("verse" > 0),
  "reference" text not null,
  "verseText" text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("translation", "book", "chapter", "verse")
);

create index "scripture_verses_book_chapter_verse_idx"
  on "scripture_verses" ("book", "chapter", "verse");
create index "scripture_verses_reference_idx"
  on "scripture_verses" ("reference");
create index "scripture_verses_text_fts_idx"
  on "scripture_verses" using gin (to_tsvector('simple', "verseText"));

create table "users" (
  "userId" uuid primary key default gen_random_uuid(),
  "role" text not null default 'user',
  "displayName" text,
  "avatarUrl" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  check ("role" in ('user', 'admin')),
  check ("displayName" is null or char_length("displayName") <= 120),
  check ("avatarUrl" is null or char_length("avatarUrl") <= 2048)
);

create table "auth_accounts" (
  "authAccountId" serial primary key,
  "userId" uuid not null references "users"("userId") on delete cascade,
  "provider" text not null,
  "providerSubject" text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("provider", "providerSubject")
);

create index "auth_accounts_user_idx" on "auth_accounts" ("userId");

create table "auth_audit_events" (
  "authAuditEventId" serial primary key,
  "userId" uuid references "users"("userId") on delete set null,
  "provider" text not null,
  "eventType" text not null,
  "outcome" text not null,
  "reason" text,
  "message" text,
  "ip" text,
  "userAgent" text,
  "createdAt" timestamptz not null default now(),
  check ("eventType" in ('login_start', 'callback_success', 'callback_failure', 'logout', 'admin_role_change')),
  check ("outcome" in ('success', 'failure'))
);
create index "auth_audit_events_created_at_idx" on "auth_audit_events" ("createdAt");
create index "auth_audit_events_user_idx" on "auth_audit_events" ("userId");
create index "auth_audit_events_type_idx" on "auth_audit_events" ("eventType");

create table "saved_scripture_items" (
  "savedId" serial primary key,
  "deviceId" text,
  "ownerUserId" uuid references "users"("userId") on delete cascade,
  "label" text,
  "saveGroupId" uuid,
  "note" text,
  "translation" text not null,
  "book" text not null,
  "chapter" integer not null check ("chapter" > 0),
  "verseStart" integer not null check ("verseStart" > 0),
  "verseEnd" integer not null check ("verseEnd" > 0),
  "reference" text not null,
  "sourceMode" text not null default 'local',
  "queryText" text,
  "createdAt" timestamptz not null default now(),
  check ("verseEnd" >= "verseStart"),
  check ("ownerUserId" is not null or "deviceId" is not null),
  check ("note" is null or char_length("note") <= 4000)
);

create index "saved_scripture_items_device_idx"
  on "saved_scripture_items" ("deviceId");
create index "saved_scripture_items_owner_user_idx"
  on "saved_scripture_items" ("ownerUserId");
create index "saved_scripture_items_device_created_sort_idx"
  on "saved_scripture_items" ("deviceId", "createdAt", "savedId");
create index "saved_scripture_items_owner_created_sort_idx"
  on "saved_scripture_items" ("ownerUserId", "createdAt", "savedId");
create index "saved_scripture_items_save_group_idx"
  on "saved_scripture_items" ("saveGroupId");
create index "saved_scripture_items_owner_group_created_idx"
  on "saved_scripture_items" ("ownerUserId", "saveGroupId", "createdAt", "savedId");
create index "saved_scripture_items_device_group_created_idx"
  on "saved_scripture_items" ("deviceId", "saveGroupId", "createdAt", "savedId");
create unique index "saved_scripture_items_device_reference_unique"
  on "saved_scripture_items" ("deviceId", "translation", "book", "chapter", "verseStart", "verseEnd")
  where "ownerUserId" is null;
create unique index "saved_scripture_items_owner_reference_unique"
  on "saved_scripture_items" ("ownerUserId", "translation", "book", "chapter", "verseStart", "verseEnd")
  where "ownerUserId" is not null;
