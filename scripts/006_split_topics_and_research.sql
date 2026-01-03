-- Create new tables for topic-based research

-- 1. Create research_topics table
-- Stores the list of identified topics to preserve their IDs
create table if not exists public.research_topics (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(analysis_id, title)
);

-- 2. Create research_results table
-- Stores the actual research content, keyed by topic_id
create table if not exists public.research_results (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  topic_id uuid not null references public.research_topics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending', -- 'pending', 'completed', 'failed'
  content jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one result per topic
  unique(topic_id)
);

-- Enable RLS
alter table public.research_topics enable row level security;
alter table public.research_results enable row level security;

-- Policies for research_topics
drop policy if exists "Users can view their own topics" on public.research_topics;
create policy "Users can view their own topics"
on public.research_topics for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own topics" on public.research_topics;
create policy "Users can insert their own topics"
on public.research_topics for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own topics" on public.research_topics;
create policy "Users can update their own topics"
on public.research_topics for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete their own topics" on public.research_topics;
create policy "Users can delete their own topics"
on public.research_topics for delete
using (auth.uid() = user_id);

-- Policies for research_results
drop policy if exists "Users can view their own results" on public.research_results;
create policy "Users can view their own results"
on public.research_results for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own results" on public.research_results;
create policy "Users can insert their own results"
on public.research_results for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own results" on public.research_results;
create policy "Users can update their own results"
on public.research_results for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete their own results" on public.research_results;
create policy "Users can delete their own results"
on public.research_results for delete
using (auth.uid() = user_id);

-- Indexes
create index if not exists research_topics_analysis_id_idx on public.research_topics(analysis_id);
create index if not exists research_topics_user_id_idx on public.research_topics(user_id);
create index if not exists research_results_topic_id_idx on public.research_results(topic_id);
create index if not exists research_results_analysis_id_idx on public.research_results(analysis_id);
create index if not exists research_results_user_id_idx on public.research_results(user_id);

-- Updated_at trigger for results
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists handle_research_results_updated_at on public.research_results;
create trigger handle_research_results_updated_at
before update on public.research_results
for each row
execute procedure public.handle_updated_at();

-- No drop table research here, handled in 007
