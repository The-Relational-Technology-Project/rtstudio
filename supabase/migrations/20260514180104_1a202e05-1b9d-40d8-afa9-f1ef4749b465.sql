ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 50;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 50;
CREATE INDEX IF NOT EXISTS idx_stories_sort_order ON public.stories(sort_order);
CREATE INDEX IF NOT EXISTS idx_prompts_sort_order ON public.prompts(sort_order);