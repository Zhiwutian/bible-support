set client_min_messages to warning;

-- DANGER: this is NOT how to do it in the real world.
-- `drop schema` INSTANTLY ERASES EVERYTHING.
drop schema "public" cascade;

create schema "public";

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

create table "saved_scripture_items" (
  "savedId" serial primary key,
  "deviceId" text not null,
  "label" text,
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
  unique ("deviceId", "translation", "book", "chapter", "verseStart", "verseEnd")
);

create index "saved_scripture_items_device_idx"
  on "saved_scripture_items" ("deviceId");
create index "saved_scripture_items_device_created_sort_idx"
  on "saved_scripture_items" ("deviceId", "createdAt", "savedId");
