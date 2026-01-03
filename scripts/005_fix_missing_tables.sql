-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create email_threads table
create table if not exists public.email_threads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Policies for email_threads (Drop first to avoid duplicates)
alter table public.email_threads enable row level security;

drop policy if exists "Users can view their own threads" on public.email_threads;
create policy "Users can view their own threads"
  on public.email_threads for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own threads" on public.email_threads;
create policy "Users can insert their own threads"
  on public.email_threads for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own threads" on public.email_threads;
create policy "Users can update their own threads"
  on public.email_threads for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own threads" on public.email_threads;
create policy "Users can delete their own threads"
  on public.email_threads for delete
  using (auth.uid() = user_id);

-- 2. Create analyses table
create table if not exists public.analyses (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid not null references public.email_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Analysis results stored as JSON
  stakeholders jsonb default '[]'::jsonb,
  action_items jsonb default '[]'::jsonb,
  deadlines jsonb default '[]'::jsonb,
  key_decisions jsonb default '[]'::jsonb,
  open_questions jsonb default '[]'::jsonb,
  
  -- Generated reply
  suggested_reply text,
  
  -- Legacy research column (optional)
  research jsonb default '[]'::jsonb,
  
  created_at timestamptz default now()
);

-- Policies for analyses
alter table public.analyses enable row level security;

drop policy if exists "Users can view their own analyses" on public.analyses;
create policy "Users can view their own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own analyses" on public.analyses;
create policy "Users can insert their own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own analyses" on public.analyses;
create policy "Users can update their own analyses"
  on public.analyses for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own analyses" on public.analyses;
create policy "Users can delete their own analyses"
  on public.analyses for delete
  using (auth.uid() = user_id);

-- 3. Create research table
create table if not exists public.research (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  topic text not null,
  status text not null default 'pending', -- 'pending', 'completed', 'failed'
  result jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure uniqueness of topic per analysis
  unique(analysis_id, topic)
);

-- Policies for research
alter table public.research enable row level security;

drop policy if exists "Users can view their own research" on public.research;
create policy "Users can view their own research"
on public.research for select
using (
  auth.uid() = (select user_id from public.analyses where id = research.analysis_id)
);

drop policy if exists "Users can insert their own research" on public.research;
create policy "Users can insert their own research"
on public.research for insert
with check (
  auth.uid() = (select user_id from public.analyses where id = research.analysis_id)
);

drop policy if exists "Users can update their own research" on public.research;
create policy "Users can update their own research"
on public.research for update
using (
  auth.uid() = (select user_id from public.analyses where id = research.analysis_id)
);

drop policy if exists "Users can delete their own research" on public.research;
create policy "Users can delete their own research"
on public.research for delete
using (
  auth.uid() = (select user_id from public.analyses where id = research.analysis_id)
);

-- Indexes (If not exists isn't supported for indexes in all generic PG versions without `do`, but `create index if not exists` is standard in modern PG)
create index if not exists email_threads_user_id_idx on public.email_threads(user_id);
create index if not exists email_threads_created_at_idx on public.email_threads(created_at desc);
create index if not exists analyses_thread_id_idx on public.analyses(thread_id);
create index if not exists analyses_user_id_idx on public.analyses(user_id);
create index if not exists research_analysis_id_idx on public.research(analysis_id);

-- Create updated_at trigger for research
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists handle_research_updated_at on public.research;
create trigger handle_research_updated_at
before update on public.research
for each row
execute procedure public.handle_updated_at();
