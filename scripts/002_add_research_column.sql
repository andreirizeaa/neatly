-- Add research column to analyses table
alter table public.analyses 
add column if not exists research jsonb default '[]'::jsonb;

-- Add comment explaining the column
comment on column public.analyses.research is 'Research findings from the AI research agent, stored as an array of research results';
