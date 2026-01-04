-- Ensure all analysis-related tables have ON DELETE CASCADE
-- This script drops existing foreign keys and recreates them with CASCADE

-- 1. Stakeholders
ALTER TABLE public.stakeholders DROP CONSTRAINT IF EXISTS stakeholders_analysis_id_fkey;
ALTER TABLE public.stakeholders 
  ADD CONSTRAINT stakeholders_analysis_id_fkey 
  FOREIGN KEY (analysis_id) 
  REFERENCES public.analyses(id) 
  ON DELETE CASCADE;

-- 2. Action Items
ALTER TABLE public.action_items DROP CONSTRAINT IF EXISTS action_items_analysis_id_fkey;
ALTER TABLE public.action_items 
  ADD CONSTRAINT action_items_analysis_id_fkey 
  FOREIGN KEY (analysis_id) 
  REFERENCES public.analyses(id) 
  ON DELETE CASCADE;

-- 3. Deadlines
ALTER TABLE public.deadlines DROP CONSTRAINT IF EXISTS deadlines_analysis_id_fkey;
ALTER TABLE public.deadlines 
  ADD CONSTRAINT deadlines_analysis_id_fkey 
  FOREIGN KEY (analysis_id) 
  REFERENCES public.analyses(id) 
  ON DELETE CASCADE;

-- 4. Key Decisions
ALTER TABLE public.key_decisions DROP CONSTRAINT IF EXISTS key_decisions_analysis_id_fkey;
ALTER TABLE public.key_decisions 
  ADD CONSTRAINT key_decisions_analysis_id_fkey 
  FOREIGN KEY (analysis_id) 
  REFERENCES public.analyses(id) 
  ON DELETE CASCADE;

-- 5. Open Questions
ALTER TABLE public.open_questions DROP CONSTRAINT IF EXISTS open_questions_analysis_id_fkey;
ALTER TABLE public.open_questions 
  ADD CONSTRAINT open_questions_analysis_id_fkey 
  FOREIGN KEY (analysis_id) 
  REFERENCES public.analyses(id) 
  ON DELETE CASCADE;

-- 6. Todos
ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS todos_analysis_id_fkey;
ALTER TABLE public.todos 
  ADD CONSTRAINT todos_analysis_id_fkey 
  FOREIGN KEY (analysis_id) 
  REFERENCES public.analyses(id) 
  ON DELETE CASCADE;

-- 7. Calendar Events
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_analysis_id_fkey;
ALTER TABLE public.calendar_events 
  ADD CONSTRAINT calendar_events_analysis_id_fkey 
  FOREIGN KEY (analysis_id) 
  REFERENCES public.analyses(id) 
  ON DELETE CASCADE;
