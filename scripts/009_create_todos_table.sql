-- Migration: Create todos table
-- Todos are created when email threads are analyzed and can be marked as complete

-- 1. Create todos table
create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  thread_id uuid not null references public.email_threads(id) on delete cascade,
  description text not null,
  assignee text,
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  due_date timestamp with time zone,
  completed boolean default false not null,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create indexes for performance
create index if not exists todos_user_id_idx on public.todos(user_id);
create index if not exists todos_analysis_id_idx on public.todos(analysis_id);
create index if not exists todos_thread_id_idx on public.todos(thread_id);
create index if not exists todos_completed_idx on public.todos(completed);
create index if not exists todos_user_completed_idx on public.todos(user_id, completed);

-- 3. Enable RLS
alter table public.todos enable row level security;

-- 4. Create RLS policies
create policy "Users can view their own todos" 
  on public.todos for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own todos" 
  on public.todos for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own todos" 
  on public.todos for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own todos" 
  on public.todos for delete 
  using (auth.uid() = user_id);
