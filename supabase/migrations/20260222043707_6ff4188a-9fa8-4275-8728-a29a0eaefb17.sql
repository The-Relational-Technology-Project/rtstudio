
-- Add columns to tools table
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS screenshot_urls text[];
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS tool_category text NOT NULL DEFAULT 'relational_tech';
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS summary text;

-- Make url nullable for relational_tech tools that don't have external URLs
ALTER TABLE public.tools ALTER COLUMN url DROP NOT NULL;

-- Add parent_tool_id to prompts table
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS parent_tool_id uuid REFERENCES public.tools(id);
