create table "prayer_partners" (
  "partnerId" serial primary key,
  "ownerUserId" uuid not null references "users"("userId") on delete cascade,
  "name" text not null,
  "prayerFocus" text not null,
  "imageUrl" text,
  "isArchived" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  check (char_length("name") <= 120),
  check (char_length("prayerFocus") <= 4000),
  check ("imageUrl" is null or char_length("imageUrl") <= 2048)
);

create index "prayer_partners_owner_user_idx"
  on "prayer_partners" ("ownerUserId");
create index "prayer_partners_owner_archived_created_idx"
  on "prayer_partners" ("ownerUserId", "isArchived", "createdAt", "partnerId");

create table "prayer_lists" (
  "listId" serial primary key,
  "ownerUserId" uuid not null references "users"("userId") on delete cascade,
  "name" text not null,
  "description" text,
  "isArchived" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  check (char_length("name") <= 120),
  check ("description" is null or char_length("description") <= 2000)
);

create index "prayer_lists_owner_user_idx"
  on "prayer_lists" ("ownerUserId");
create index "prayer_lists_owner_archived_created_idx"
  on "prayer_lists" ("ownerUserId", "isArchived", "createdAt", "listId");

create table "prayer_list_members" (
  "prayerListMemberId" serial primary key,
  "listId" integer not null references "prayer_lists"("listId") on delete cascade,
  "partnerId" integer not null references "prayer_partners"("partnerId") on delete cascade,
  "position" integer not null check ("position" > 0),
  "createdAt" timestamptz not null default now(),
  unique ("listId", "partnerId"),
  unique ("listId", "position")
);

create index "prayer_list_members_list_idx"
  on "prayer_list_members" ("listId");
create index "prayer_list_members_partner_idx"
  on "prayer_list_members" ("partnerId");

create table "prayer_sessions" (
  "prayerSessionId" serial primary key,
  "ownerUserId" uuid not null references "users"("userId") on delete cascade,
  "listId" integer references "prayer_lists"("listId") on delete set null,
  "listNameSnapshot" text not null,
  "note" text,
  "createdAt" timestamptz not null default now(),
  check (char_length("listNameSnapshot") <= 120),
  check ("note" is null or char_length("note") <= 4000)
);

create index "prayer_sessions_owner_created_idx"
  on "prayer_sessions" ("ownerUserId", "createdAt", "prayerSessionId");
create index "prayer_sessions_list_created_idx"
  on "prayer_sessions" ("listId", "createdAt", "prayerSessionId");

create table "prayer_partner_notes" (
  "prayerPartnerNoteId" serial primary key,
  "ownerUserId" uuid not null references "users"("userId") on delete cascade,
  "partnerId" integer references "prayer_partners"("partnerId") on delete set null,
  "partnerNameSnapshot" text not null,
  "note" text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  check (char_length("partnerNameSnapshot") <= 120),
  check (char_length("note") <= 4000)
);

create index "prayer_partner_notes_owner_created_idx"
  on "prayer_partner_notes" ("ownerUserId", "createdAt", "prayerPartnerNoteId");
create index "prayer_partner_notes_partner_created_idx"
  on "prayer_partner_notes" ("partnerId", "createdAt", "prayerPartnerNoteId");
