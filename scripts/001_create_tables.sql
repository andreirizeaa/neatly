-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create email_threads table
create table if not exists public.email_threads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create analyses table
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
  
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.email_threads enable row level security;
alter table public.analyses enable row level security;

-- RLS Policies for email_threads
create policy "Users can view their own threads"
  on public.email_threads for select
  using (auth.uid() = user_id);

create policy "Users can insert their own threads"
  on public.email_threads for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own threads"
  on public.email_threads for update
  using (auth.uid() = user_id);

create policy "Users can delete their own threads"
  on public.email_threads for delete
  using (auth.uid() = user_id);

-- RLS Policies for analyses
create policy "Users can view their own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own analyses"
  on public.analyses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own analyses"
  on public.analyses for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists email_threads_user_id_idx on public.email_threads(user_id);
create index if not exists email_threads_created_at_idx on public.email_threads(created_at desc);
create index if not exists analyses_thread_id_idx on public.analyses(thread_id);
create index if not exists analyses_user_id_idx on public.analyses(user_id);
