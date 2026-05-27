-- Create build_plans table. Replaces the prototype HTML build as the headline
-- artifact Sidekick produces: a detailed prompt + a concrete plan a builder
-- can run with.
CREATE TABLE public.build_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  builder_id UUID NOT NULL,
  title TEXT NOT NULL,
  detailed_prompt TEXT NOT NULL,
  plan_markdown TEXT NOT NULL,
  recommended_track TEXT,                       -- 'lovable' | 'claude_code' | null
  source_chat_excerpt TEXT,                     -- last several messages that led here
  library_item_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT NOT NULL DEFAULT 'claude-opus-4-7',
  tokens_used INTEGER DEFAULT 0,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  share_id TEXT UNIQUE,
  share_view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.build_plans ENABLE ROW LEVEL SECURITY;

-- Builders can view their own plans
CREATE POLICY "Builders can view own build plans"
ON public.build_plans FOR SELECT
TO authenticated
USING (auth.uid() = builder_id);

-- Builders can update their own plans (title editing, share toggling)
CREATE POLICY "Builders can update own build plans"
ON public.build_plans FOR UPDATE
TO authenticated
USING (auth.uid() = builder_id)
WITH CHECK (auth.uid() = builder_id);

-- Builders can delete their own plans
CREATE POLICY "Builders can delete own build plans"
ON public.build_plans FOR DELETE
TO authenticated
USING (auth.uid() = builder_id);

-- Anyone can view shared plans (for public share pages)
CREATE POLICY "Anyone can view shared build plans"
ON public.build_plans FOR SELECT
TO anon
USING (is_shared = true);

CREATE POLICY "Authenticated users can view shared build plans"
ON public.build_plans FOR SELECT
TO authenticated
USING (is_shared = true);

-- Inserts are done by the generate-build-plan edge function with the service role.
-- No insert policy needed for end-users; only the function writes new rows.

-- Index for the profile "my build plans" query
CREATE INDEX idx_build_plans_builder_created
ON public.build_plans (builder_id, created_at DESC);

-- Trigger to bump updated_at on UPDATE
CREATE OR REPLACE FUNCTION public.set_build_plans_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER build_plans_set_updated_at
BEFORE UPDATE ON public.build_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_build_plans_updated_at();
