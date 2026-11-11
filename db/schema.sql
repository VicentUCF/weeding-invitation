-- Run against a dedicated PostgreSQL database. App connections use a private schema.
create schema if not exists wedding;
revoke all on schema wedding from public;

create table if not exists wedding.settings (
  id boolean primary key default true check (id),
  rsvp_enabled boolean not null default true,
  rsvp_deadline date,
  updated_at timestamptz not null default now()
);
insert into wedding.settings (id) values (true) on conflict (id) do nothing;

create table if not exists wedding.invitation_groups (
  id uuid primary key default gen_random_uuid(),
  name varchar(160) not null unique,
  locale varchar(2) not null default 'es' check (locale in ('es', 'uk')),
  created_at timestamptz not null default now()
);

create table if not exists wedding.invitations (
  id uuid primary key default gen_random_uuid(),
  token_hash char(64) not null unique,
  token_encrypted text not null,
  addressee varchar(160) not null,
  email varchar(254),
  personal_note varchar(1000),
  personal_note_uk varchar(1000),
  group_id uuid references wedding.invitation_groups(id) on delete set null,
  locale varchar(2) not null default 'es' check (locale in ('es', 'uk')),
  sent_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invitations_created_at_idx on wedding.invitations (created_at desc);
alter table wedding.invitations add column if not exists group_id uuid references wedding.invitation_groups(id) on delete set null;
alter table wedding.invitations add column if not exists locale varchar(2) not null default 'es';
alter table wedding.invitations add column if not exists personal_note_uk varchar(1000);
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'wedding.invitations'::regclass and conname = 'invitations_locale_check') then
    alter table wedding.invitations add constraint invitations_locale_check check (locale in ('es', 'uk'));
  end if;
end $$;
create index if not exists invitations_group_idx on wedding.invitations (group_id);

create table if not exists wedding.guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references wedding.invitations(id) on delete cascade,
  sort_order integer not null default 0,
  name varchar(160) not null,
  response varchar(10) not null default 'pending' check (response in ('pending', 'yes', 'no')),
  allergies varchar(2000) not null default '',
  dietary_notes varchar(1000) not null default '',
  observations varchar(1000) not null default '',
  food_data_consent boolean not null default false,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (response = 'yes' or (allergies = '' and dietary_notes = '' and observations = '' and food_data_consent = false)),
  check (allergies = '' and dietary_notes = '' or food_data_consent)
);
alter table wedding.guests add column if not exists sort_order integer not null default 0;
alter table wedding.guests add column if not exists observations varchar(1000) not null default '';
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'wedding.guests'::regclass and conname = 'guests_observations_attending_check') then
    alter table wedding.guests add constraint guests_observations_attending_check check (response = 'yes' or observations = '');
  end if;
end $$;
create index if not exists guests_invitation_idx on wedding.guests (invitation_id);
create index if not exists guests_response_idx on wedding.guests (response);

-- The private schema is reachable only through the server's direct PostgreSQL connection.
revoke all on all tables in schema wedding from public;
revoke all on all sequences in schema wedding from public;
alter default privileges in schema wedding revoke all on tables from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema wedding from anon';
    execute 'revoke all on all tables in schema wedding from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on schema wedding from authenticated';
    execute 'revoke all on all tables in schema wedding from authenticated';
  end if;
end $$;
alter table wedding.settings enable row level security;
alter table wedding.invitation_groups enable row level security;
alter table wedding.invitations enable row level security;
alter table wedding.guests enable row level security;
