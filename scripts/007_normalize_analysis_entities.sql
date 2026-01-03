-- Normalize Analysis Entities
-- Extracting JSONB arrays into dedicated relational tables

-- 1. Stakeholders
create table if not exists public.stakeholders (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  role text,
  evidence text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Action Items
create table if not exists public.action_items (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  assignee text,
  priority text check (priority in ('high', 'medium', 'low', 'unknown')) default 'medium',
  evidence text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Deadlines
create table if not exists public.deadlines (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  description text,
  evidence text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Key Decisions
create table if not exists public.key_decisions (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  decision text not null,
  rationale text,
  evidence text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Open Questions
create table if not exists public.open_questions (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  context text,
  evidence text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists stakeholders_analysis_id_idx on public.stakeholders(analysis_id);
create index if not exists stakeholders_user_id_idx on public.stakeholders(user_id);
create index if not exists action_items_analysis_id_idx on public.action_items(analysis_id);
create index if not exists action_items_user_id_idx on public.action_items(user_id);
create index if not exists deadlines_analysis_id_idx on public.deadlines(analysis_id);
create index if not exists deadlines_user_id_idx on public.deadlines(user_id);
create index if not exists key_decisions_analysis_id_idx on public.key_decisions(analysis_id);
create index if not exists key_decisions_user_id_idx on public.key_decisions(user_id);
create index if not exists open_questions_analysis_id_idx on public.open_questions(analysis_id);
create index if not exists open_questions_user_id_idx on public.open_questions(user_id);

-- Enable RLS
alter table public.stakeholders enable row level security;
alter table public.action_items enable row level security;
alter table public.deadlines enable row level security;
alter table public.key_decisions enable row level security;
alter table public.open_questions enable row level security;

-- Policies for Stakeholders
create policy "Users can view their own stakeholders" on public.stakeholders for select using (auth.uid() = user_id);
create policy "Users can insert their own stakeholders" on public.stakeholders for insert with check (auth.uid() = user_id);
create policy "Users can update their own stakeholders" on public.stakeholders for update using (auth.uid() = user_id);
create policy "Users can delete their own stakeholders" on public.stakeholders for delete using (auth.uid() = user_id);

-- Policies for Action Items
create policy "Users can view their own action items" on public.action_items for select using (auth.uid() = user_id);
create policy "Users can insert their own action items" on public.action_items for insert with check (auth.uid() = user_id);
create policy "Users can update their own action items" on public.action_items for update using (auth.uid() = user_id);
create policy "Users can delete their own action items" on public.action_items for delete using (auth.uid() = user_id);

-- Policies for Deadlines
create policy "Users can view their own deadlines" on public.deadlines for select using (auth.uid() = user_id);
create policy "Users can insert their own deadlines" on public.deadlines for insert with check (auth.uid() = user_id);
create policy "Users can update their own deadlines" on public.deadlines for update using (auth.uid() = user_id);
create policy "Users can delete their own deadlines" on public.deadlines for delete using (auth.uid() = user_id);

-- Policies for Key Decisions
create policy "Users can view their own key decisions" on public.key_decisions for select using (auth.uid() = user_id);
create policy "Users can insert their own key decisions" on public.key_decisions for insert with check (auth.uid() = user_id);
create policy "Users can update their own key decisions" on public.key_decisions for update using (auth.uid() = user_id);
create policy "Users can delete their own key decisions" on public.key_decisions for delete using (auth.uid() = user_id);

-- Policies for Open Questions
create policy "Users can view their own open questions" on public.open_questions for select using (auth.uid() = user_id);
create policy "Users can insert their own open questions" on public.open_questions for insert with check (auth.uid() = user_id);
create policy "Users can update their own open questions" on public.open_questions for update using (auth.uid() = user_id);
create policy "Users can delete their own open questions" on public.open_questions for delete using (auth.uid() = user_id);

-- Cleanup: drop unused table
drop table if exists public.research;
