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
