-- Update RLS policies to allow inserts without requiring Supabase auth
-- Since the app uses custom password authentication at the page level

-- Stories table: Remove user_id requirement and allow inserts for anyone
DROP POLICY IF EXISTS "Authenticated users can insert stories" ON public.stories;

CREATE POLICY "Anyone can insert stories"
ON public.stories
FOR INSERT
WITH CHECK (true);

-- Also make user_id nullable since we're not using it
ALTER TABLE public.stories ALTER COLUMN user_id DROP NOT NULL;

-- Tools table: Already allows authenticated users, change to allow anyone
DROP POLICY IF EXISTS "Authenticated users can insert tools" ON public.tools;

CREATE POLICY "Anyone can insert tools"
ON public.tools
FOR INSERT
WITH CHECK (true);

-- Prompts table: Already allows authenticated users, change to allow anyone
DROP POLICY IF EXISTS "Authenticated users can insert prompts" ON public.prompts;

CREATE POLICY "Anyone can insert prompts"
ON public.prompts
FOR INSERT
WITH CHECK (true);