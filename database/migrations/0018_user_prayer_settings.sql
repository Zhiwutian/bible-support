create table "user_prayer_settings" (
  "userId" uuid primary key references "users"("userId") on delete cascade,
  "reminderEnabled" boolean not null default false,
  "reminderHour" integer,
  "reminderMinute" integer,
  "reminderTimezone" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  check (
    "reminderHour" is null
    or ("reminderHour" >= 0 and "reminderHour" <= 23)
  ),
  check (
    "reminderMinute" is null
    or ("reminderMinute" >= 0 and "reminderMinute" <= 59)
  ),
  check (
    "reminderTimezone" is null
    or char_length("reminderTimezone") <= 64
  ),
  check (
    not "reminderEnabled"
    or (
      "reminderHour" is not null
      and "reminderMinute" is not null
      and "reminderTimezone" is not null
    )
  )
);
