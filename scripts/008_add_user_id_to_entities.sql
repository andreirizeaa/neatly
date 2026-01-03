-- Migration: Add user_id to all normalized tables and backfill data
-- This script applies changes on top of 006/007 if they were run without user_id

-- 1. research_topics
alter table if exists public.research_topics 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Backfill user_id from analyses
update public.research_topics rt
set user_id = a.user_id
from public.analyses a
where rt.analysis_id = a.id
and rt.user_id is null;

-- Make user_id not null (after backfill)
-- We check if there are any nulls first to avoid errors if table is empty or update failed
do $$
begin
  if exists (select 1 from public.research_topics) then
    alter table public.research_topics alter column user_id set not null;
  end if;
end $$;

create index if not exists research_topics_user_id_idx on public.research_topics(user_id);


-- 2. research_results
alter table if exists public.research_results 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.research_results rr
set user_id = a.user_id
from public.analyses a
where rr.analysis_id = a.id
and rr.user_id is null;

do $$
begin
  if exists (select 1 from public.research_results) then
    alter table public.research_results alter column user_id set not null;
  end if;
end $$;

create index if not exists research_results_user_id_idx on public.research_results(user_id);


-- 3. stakeholders
alter table if exists public.stakeholders 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.stakeholders s
set user_id = a.user_id
from public.analyses a
where s.analysis_id = a.id
and s.user_id is null;

do $$
begin
  if exists (select 1 from public.stakeholders) then
    alter table public.stakeholders alter column user_id set not null;
  end if;
end $$;

create index if not exists stakeholders_user_id_idx on public.stakeholders(user_id);


-- 4. action_items
alter table if exists public.action_items 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.action_items ai
set user_id = a.user_id
from public.analyses a
where ai.analysis_id = a.id
and ai.user_id is null;

do $$
begin
  if exists (select 1 from public.action_items) then
    alter table public.action_items alter column user_id set not null;
  end if;
end $$;

create index if not exists action_items_user_id_idx on public.action_items(user_id);


-- 5. deadlines
alter table if exists public.deadlines 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.deadlines d
set user_id = a.user_id
from public.analyses a
where d.analysis_id = a.id
and d.user_id is null;

do $$
begin
  if exists (select 1 from public.deadlines) then
    alter table public.deadlines alter column user_id set not null;
  end if;
end $$;

create index if not exists deadlines_user_id_idx on public.deadlines(user_id);


-- 6. key_decisions
alter table if exists public.key_decisions 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.key_decisions k
set user_id = a.user_id
from public.analyses a
where k.analysis_id = a.id
and k.user_id is null;

do $$
begin
  if exists (select 1 from public.key_decisions) then
    alter table public.key_decisions alter column user_id set not null;
  end if;
end $$;

create index if not exists key_decisions_user_id_idx on public.key_decisions(user_id);


-- 7. open_questions
alter table if exists public.open_questions 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.open_questions o
set user_id = a.user_id
from public.analyses a
where o.analysis_id = a.id
and o.user_id is null;

do $$
begin
  if exists (select 1 from public.open_questions) then
    alter table public.open_questions alter column user_id set not null;
  end if;
end $$;

create index if not exists open_questions_user_id_idx on public.open_questions(user_id);


-- 8. Update RLS Policies to use simple user_id check
-- We drop and recreate policies to ensure they use the new column
-- Loop through all tables and update policies

-- Stakeholders
drop policy if exists "Users can view their own stakeholders" on public.stakeholders;
create policy "Users can view their own stakeholders" on public.stakeholders for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own stakeholders" on public.stakeholders;
create policy "Users can insert their own stakeholders" on public.stakeholders for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own stakeholders" on public.stakeholders;
create policy "Users can update their own stakeholders" on public.stakeholders for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own stakeholders" on public.stakeholders;
create policy "Users can delete their own stakeholders" on public.stakeholders for delete using (auth.uid() = user_id);

-- Action Items
drop policy if exists "Users can view their own action items" on public.action_items;
create policy "Users can view their own action items" on public.action_items for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own action items" on public.action_items;
create policy "Users can insert their own action items" on public.action_items for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own action items" on public.action_items;
create policy "Users can update their own action items" on public.action_items for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own action items" on public.action_items;
create policy "Users can delete their own action items" on public.action_items for delete using (auth.uid() = user_id);

-- Apply similar loops for other tables... 
-- Manually listing them for clarity

-- Deadlines
drop policy if exists "Users can view their own deadlines" on public.deadlines;
create policy "Users can view their own deadlines" on public.deadlines for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own deadlines" on public.deadlines;
create policy "Users can insert their own deadlines" on public.deadlines for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own deadlines" on public.deadlines;
create policy "Users can update their own deadlines" on public.deadlines for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own deadlines" on public.deadlines;
create policy "Users can delete their own deadlines" on public.deadlines for delete using (auth.uid() = user_id);

-- Key Decisions
drop policy if exists "Users can view their own key decisions" on public.key_decisions;
create policy "Users can view their own key decisions" on public.key_decisions for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own key decisions" on public.key_decisions;
create policy "Users can insert their own key decisions" on public.key_decisions for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own key decisions" on public.key_decisions;
create policy "Users can update their own key decisions" on public.key_decisions for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own key decisions" on public.key_decisions;
create policy "Users can delete their own key decisions" on public.key_decisions for delete using (auth.uid() = user_id);

-- Open Questions
drop policy if exists "Users can view their own open questions" on public.open_questions;
create policy "Users can view their own open questions" on public.open_questions for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own open questions" on public.open_questions;
create policy "Users can insert their own open questions" on public.open_questions for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own open questions" on public.open_questions;
create policy "Users can update their own open questions" on public.open_questions for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own open questions" on public.open_questions;
create policy "Users can delete their own open questions" on public.open_questions for delete using (auth.uid() = user_id);

-- Research Topics
drop policy if exists "Users can view their own topics" on public.research_topics;
create policy "Users can view their own topics" on public.research_topics for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own topics" on public.research_topics;
create policy "Users can insert their own topics" on public.research_topics for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own topics" on public.research_topics;
create policy "Users can update their own topics" on public.research_topics for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own topics" on public.research_topics;
create policy "Users can delete their own topics" on public.research_topics for delete using (auth.uid() = user_id);

-- Research Results
drop policy if exists "Users can view their own results" on public.research_results;
create policy "Users can view their own results" on public.research_results for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own results" on public.research_results;
create policy "Users can insert their own results" on public.research_results for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own results" on public.research_results;
create policy "Users can update their own results" on public.research_results for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own results" on public.research_results;
create policy "Users can delete their own results" on public.research_results for delete using (auth.uid() = user_id);

-- 9. Drop Legacy Research Table
drop table if exists public.research;
