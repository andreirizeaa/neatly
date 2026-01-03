-- Create the research table to store structured research results per topic
create table if not exists public.research (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid not null references public.analysis(id) on delete cascade,
  topic text not null,
  status text not null default 'pending', -- 'pending', 'completed', 'failed'
  result jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure uniqueness of topic per analysis to prevent duplicates
  unique(analysis_id, topic)
);

-- Enable Row Level Security
alter table public.research enable row level security;

-- Policies
-- Users can see research if they own the parent analysis
create policy "Users can view their own research"
on public.research for select
using (
  auth.uid() = (select user_id from public.analysis where id = research.analysis_id)
);

-- Users can insert research if they own the parent analysis
create policy "Users can insert their own research"
on public.research for insert
with check (
  auth.uid() = (select user_id from public.analysis where id = research.analysis_id)
);

-- Users can update research if they own the parent analysis
create policy "Users can update their own research"
on public.research for update
using (
  auth.uid() = (select user_id from public.analysis where id = research.analysis_id)
);

-- Users can delete research if they own the parent analysis
create policy "Users can delete their own research"
on public.research for delete
using (
  auth.uid() = (select user_id from public.analysis where id = research.analysis_id)
);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_research_updated_at
before update on public.research
for each row
execute procedure public.handle_updated_at();
