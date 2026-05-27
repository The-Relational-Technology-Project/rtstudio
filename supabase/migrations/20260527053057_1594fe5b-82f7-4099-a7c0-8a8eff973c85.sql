CREATE TABLE public.build_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  builder_id UUID NOT NULL,
  title TEXT NOT NULL,
  detailed_prompt TEXT NOT NULL,
  plan_markdown TEXT NOT NULL,
  recommended_track TEXT,
  source_chat_excerpt TEXT,
  library_item_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT NOT NULL DEFAULT 'claude-opus-4-7',
  tokens_used INTEGER DEFAULT 0,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  share_id TEXT UNIQUE,
  share_view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.build_plans TO anon;
GRANT SELECT, UPDATE, DELETE ON public.build_plans TO authenticated;
GRANT ALL ON public.build_plans TO service_role;

ALTER TABLE public.build_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Builders can view own build plans"
ON public.build_plans FOR SELECT
TO authenticated
USING (auth.uid() = builder_id);

CREATE POLICY "Builders can update own build plans"
ON public.build_plans FOR UPDATE
TO authenticated
USING (auth.uid() = builder_id)
WITH CHECK (auth.uid() = builder_id);

CREATE POLICY "Builders can delete own build plans"
ON public.build_plans FOR DELETE
TO authenticated
USING (auth.uid() = builder_id);

CREATE POLICY "Anyone can view shared build plans"
ON public.build_plans FOR SELECT
TO anon
USING (is_shared = true);

CREATE POLICY "Authenticated users can view shared build plans"
ON public.build_plans FOR SELECT
TO authenticated
USING (is_shared = true);

CREATE INDEX idx_build_plans_builder_created
ON public.build_plans (builder_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_build_plans_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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