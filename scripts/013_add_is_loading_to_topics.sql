-- Add is_loading column to research_topics for persistent loading state
-- This allows the loading state to persist across page navigations

-- Add the is_loading column with default true (new topics start as loading)
alter table public.research_topics 
add column if not exists is_loading boolean not null default true;

-- Create an index for efficient querying of loading topics
create index if not exists research_topics_is_loading_idx on public.research_topics(is_loading);
