-- Migration: Create user_profiles table with auto-creation on signup
-- and restructure foreign key relationships
-- ============================================================

-- IMPORTANT: Run this migration with caution. Ensure you have a backup.

-- ============================================================
-- PART 1: Create user_profiles table
-- ============================================================

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- RLS Policies for user_profiles
create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- Note: Insert is handled by trigger, so we allow service role inserts
create policy "Service can insert profiles"
  on public.user_profiles for insert
  with check (true);

-- Index on email for lookups
create index if not exists user_profiles_email_idx on public.user_profiles(email);

-- ============================================================
-- PART 2: Create trigger for auto-creating profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- PART 3: Backfill existing users into user_profiles
-- ============================================================

insert into public.user_profiles (id, email)
select id, email from auth.users
where id not in (select id from public.user_profiles)
on conflict (id) do nothing;

-- ============================================================
-- PART 4: Update foreign keys to reference user_profiles
-- We need to drop and recreate constraints for each table
-- ============================================================

-- 4.1 email_threads
alter table public.email_threads drop constraint if exists email_threads_user_id_fkey;
alter table public.email_threads 
  add constraint email_threads_user_id_fkey 
  foreign key (user_id) references public.user_profiles(id) on delete cascade;

-- 4.2 analyses
alter table public.analyses drop constraint if exists analyses_user_id_fkey;
alter table public.analyses 
  add constraint analyses_user_id_fkey 
  foreign key (user_id) references public.user_profiles(id) on delete cascade;

-- 4.3 stakeholders
alter table public.stakeholders drop constraint if exists stakeholders_user_id_fkey;
alter table public.stakeholders 
  add constraint stakeholders_user_id_fkey 
  foreign key (user_id) references public.user_profiles(id) on delete cascade;

-- 4.4 action_items
alter table public.action_items drop constraint if exists action_items_user_id_fkey;
alter table public.action_items 
  add constraint action_items_user_id_fkey 
  foreign key (user_id) references public.user_profiles(id) on delete cascade;

-- 4.5 deadlines
alter table public.deadlines drop constraint if exists deadlines_user_id_fkey;
alter table public.deadlines 
  add constraint deadlines_user_id_fkey 
  foreign key (user_id) references public.user_profiles(id) on delete cascade;

-- 4.6 key_decisions
alter table public.key_decisions drop constraint if exists key_decisions_user_id_fkey;
alter table public.key_decisions 
  add constraint key_decisions_user_id_fkey 
  foreign key (user_id) references public.user_profiles(id) on delete cascade;

-- 4.7 open_questions
alter table public.open_questions drop constraint if exists open_questions_user_id_fkey;
alter table public.open_questions 
  add constraint open_questions_user_id_fkey 
  foreign key (user_id) references public.user_profiles(id) on delete cascade;

-- 4.8 research_topics
alter table public.research_topics drop constraint if exists research_topics_user_id_fkey;
alter table public.research_topics 
  add constraint research_topics_user_id_fkey 
  foreign key (user_id) references public.user_profiles(id) on delete cascade;

-- 4.9 research_results
alter table public.research_results drop constraint if exists research_results_user_id_fkey;
alter table public.research_results 
  add constraint research_results_user_id_fkey 
  foreign key (user_id) references public.user_profiles(id) on delete cascade;

-- 4.10 todos
alter table public.todos drop constraint if exists todos_user_id_fkey;
alter table public.todos 
  add constraint todos_user_id_fkey 
  foreign key (user_id) references public.user_profiles(id) on delete cascade;

-- 4.11 calendar_events
alter table public.calendar_events drop constraint if exists calendar_events_user_id_fkey;
alter table public.calendar_events 
  add constraint calendar_events_user_id_fkey 
  foreign key (user_id) references public.user_profiles(id) on delete cascade;

-- ============================================================
-- PART 5: Add thread_id to child entity tables (alongside analysis_id)
-- This enables direct querying by thread without going through analyses
-- ============================================================

-- 5.1 stakeholders
alter table public.stakeholders 
  add column if not exists thread_id uuid references public.email_threads(id) on delete cascade;

-- Backfill thread_id from analyses
update public.stakeholders s
set thread_id = a.thread_id
from public.analyses a
where s.analysis_id = a.id
and s.thread_id is null;

create index if not exists stakeholders_thread_id_idx on public.stakeholders(thread_id);

-- 5.2 action_items
alter table public.action_items 
  add column if not exists thread_id uuid references public.email_threads(id) on delete cascade;

update public.action_items ai
set thread_id = a.thread_id
from public.analyses a
where ai.analysis_id = a.id
and ai.thread_id is null;

create index if not exists action_items_thread_id_idx on public.action_items(thread_id);

-- 5.3 deadlines
alter table public.deadlines 
  add column if not exists thread_id uuid references public.email_threads(id) on delete cascade;

update public.deadlines d
set thread_id = a.thread_id
from public.analyses a
where d.analysis_id = a.id
and d.thread_id is null;

create index if not exists deadlines_thread_id_idx on public.deadlines(thread_id);

-- 5.4 key_decisions
alter table public.key_decisions 
  add column if not exists thread_id uuid references public.email_threads(id) on delete cascade;

update public.key_decisions k
set thread_id = a.thread_id
from public.analyses a
where k.analysis_id = a.id
and k.thread_id is null;

create index if not exists key_decisions_thread_id_idx on public.key_decisions(thread_id);

-- 5.5 open_questions
alter table public.open_questions 
  add column if not exists thread_id uuid references public.email_threads(id) on delete cascade;

update public.open_questions o
set thread_id = a.thread_id
from public.analyses a
where o.analysis_id = a.id
and o.thread_id is null;

create index if not exists open_questions_thread_id_idx on public.open_questions(thread_id);

-- 5.6 research_topics
alter table public.research_topics 
  add column if not exists thread_id uuid references public.email_threads(id) on delete cascade;

update public.research_topics rt
set thread_id = a.thread_id
from public.analyses a
where rt.analysis_id = a.id
and rt.thread_id is null;

create index if not exists research_topics_thread_id_idx on public.research_topics(thread_id);

-- 5.7 research_results
alter table public.research_results 
  add column if not exists thread_id uuid references public.email_threads(id) on delete cascade;

update public.research_results rr
set thread_id = a.thread_id
from public.analyses a
where rr.analysis_id = a.id
and rr.thread_id is null;

create index if not exists research_results_thread_id_idx on public.research_results(thread_id);

-- ============================================================
-- PART 6: Updated_at trigger for user_profiles
-- ============================================================

create or replace function public.update_user_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_profiles_updated_at on public.user_profiles;
create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row
  execute function public.update_user_profiles_updated_at();

-- ============================================================
-- Migration Complete
-- ============================================================
-- Summary of changes:
-- 1. Created user_profiles table with RLS
-- 2. Added trigger to auto-create profile on user signup
-- 3. Backfilled existing users
-- 4. Updated all FK references from auth.users to user_profiles
-- 5. Added thread_id to child entity tables
-- 6. Added updated_at trigger for user_profiles
