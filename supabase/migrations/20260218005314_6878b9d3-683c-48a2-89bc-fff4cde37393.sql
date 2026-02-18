
-- 1. Add local_tech_ecosystem to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS local_tech_ecosystem text;

-- 2. Add user_id to prompts
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add UPDATE + DELETE policies for prompt owners
CREATE POLICY "Users can update own prompts"
  ON public.prompts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts"
  ON public.prompts FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Add user_id to tools
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add UPDATE + DELETE policies for tool owners
CREATE POLICY "Users can update own tools"
  ON public.tools FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tools"
  ON public.tools FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Create library_bookmarks table
CREATE TABLE IF NOT EXISTS public.library_bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  item_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('story', 'prompt', 'tool')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id, item_type)
);

ALTER TABLE public.library_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON public.library_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON public.library_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.library_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Stories: add UPDATE + DELETE policies for owners
CREATE POLICY "Users can update own stories"
  ON public.stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON public.stories FOR DELETE
  USING (auth.uid() = user_id);
