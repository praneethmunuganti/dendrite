-- ============================================================
-- Dendrite Database Migration
-- Run this in Supabase: Dashboard > SQL Editor > New query
-- ============================================================

-- Enable UUID extension (already enabled in Supabase by default)
create extension if not exists "uuid-ossp";

-- ============================================================
-- Topics table
-- ============================================================
create table if not exists topics (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- RLS: users can only see/edit their own topics
alter table topics enable row level security;

create policy "Users manage own topics"
  on topics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Notes table
-- ============================================================
create table if not exists notes (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  topic_id       uuid references topics(id) on delete set null,
  parent_note_id uuid references notes(id) on delete set null,
  title          text not null default '',
  content        text not null default '',
  tags           text[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- RLS
alter table notes enable row level security;

create policy "Users manage own notes"
  on notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at();

-- ============================================================
-- Note Versions table
-- ============================================================
create table if not exists note_versions (
  id             uuid primary key default uuid_generate_v4(),
  note_id        uuid not null references notes(id) on delete cascade,
  title          text not null default '',
  content        text not null default '',
  version_number integer not null,
  message        text,
  created_at     timestamptz not null default now(),
  unique (note_id, version_number)
);

-- RLS (join through notes to check ownership)
alter table note_versions enable row level security;

create policy "Users manage own note versions"
  on note_versions for all
  using (
    exists (
      select 1 from notes
      where notes.id = note_versions.note_id
        and notes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from notes
      where notes.id = note_versions.note_id
        and notes.user_id = auth.uid()
    )
  );

-- ============================================================
-- Indexes for performance
-- ============================================================
create index if not exists idx_notes_user_id      on notes(user_id);
create index if not exists idx_notes_topic_id     on notes(topic_id);
create index if not exists idx_notes_parent       on notes(parent_note_id);
create index if not exists idx_topics_user_id     on topics(user_id);
create index if not exists idx_versions_note_id   on note_versions(note_id);
