-- Add suggested_replies jsonb column
ALTER TABLE public.analyses 
ADD COLUMN IF NOT EXISTS suggested_replies JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data
-- We'll wrap the existing string in an object structure: { title: "Draft", content: "..." }
UPDATE public.analyses 
SET suggested_replies = jsonb_build_array(
    jsonb_build_object(
        'title', 'Original Draft', 
        'content', suggested_reply
    )
)
WHERE suggested_reply IS NOT NULL AND suggested_reply != '';
