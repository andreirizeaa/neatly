-- Migration: Create calendar_events table
-- Calendar events are created from email analysis deadlines or manually by users

-- 1. Create calendar_events table
create table if not exists public.calendar_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete cascade,
  thread_id uuid references public.email_threads(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  all_day boolean default false not null,
  color text check (color in ('sky', 'amber', 'violet', 'rose', 'emerald', 'orange')) default 'sky',
  location text,
  source_type text check (source_type in ('deadline', 'manual')) default 'manual',
  source_evidence text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create indexes for performance
create index if not exists calendar_events_user_id_idx on public.calendar_events(user_id);
create index if not exists calendar_events_analysis_id_idx on public.calendar_events(analysis_id);
create index if not exists calendar_events_thread_id_idx on public.calendar_events(thread_id);
create index if not exists calendar_events_start_time_idx on public.calendar_events(start_time);
create index if not exists calendar_events_user_start_idx on public.calendar_events(user_id, start_time);

-- 3. Enable RLS
alter table public.calendar_events enable row level security;

-- 4. Create RLS policies
create policy "Users can view their own calendar events" 
  on public.calendar_events for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own calendar events" 
  on public.calendar_events for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own calendar events" 
  on public.calendar_events for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own calendar events" 
  on public.calendar_events for delete 
  using (auth.uid() = user_id);

-- 5. Create updated_at trigger
create or replace function public.update_calendar_events_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger calendar_events_updated_at
  before update on public.calendar_events
  for each row
  execute function public.update_calendar_events_updated_at();
