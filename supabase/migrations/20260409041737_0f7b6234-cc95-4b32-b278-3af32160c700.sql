
-- Create prototypes table
CREATE TABLE public.prototypes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  builder_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  generated_code TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'claude-opus-4-20250514',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_shared BOOLEAN NOT NULL DEFAULT false,
  share_id TEXT UNIQUE,
  share_view_count INTEGER NOT NULL DEFAULT 0,
  tool_name TEXT,
  refinement_of UUID REFERENCES public.prototypes(id)
);

-- Enable RLS
ALTER TABLE public.prototypes ENABLE ROW LEVEL SECURITY;

-- Builders can view their own prototypes
CREATE POLICY "Builders can view own prototypes"
ON public.prototypes FOR SELECT
TO authenticated
USING (auth.uid() = builder_id);

-- Anyone can view shared prototypes (for public share pages)
CREATE POLICY "Anyone can view shared prototypes"
ON public.prototypes FOR SELECT
TO anon
USING (is_shared = true);

-- Authenticated users can also view shared prototypes
CREATE POLICY "Authenticated can view shared prototypes"
ON public.prototypes FOR SELECT
TO authenticated
USING (is_shared = true);

-- Builders can insert their own prototypes
CREATE POLICY "Builders can insert own prototypes"
ON public.prototypes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = builder_id);

-- Builders can update their own prototypes (for sharing toggle)
CREATE POLICY "Builders can update own prototypes"
ON public.prototypes FOR UPDATE
TO authenticated
USING (auth.uid() = builder_id);

-- Create prototype_counter table (single-row counter)
CREATE TABLE public.prototype_counter (
  id TEXT NOT NULL DEFAULT 'global' PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prototype_counter ENABLE ROW LEVEL SECURITY;

-- Anyone can view the count
CREATE POLICY "Anyone can view prototype count"
ON public.prototype_counter FOR SELECT
TO anon, authenticated
USING (true);

-- Seed the counter with initial row
INSERT INTO public.prototype_counter (id, count) VALUES ('global', 0);

-- Create index for rate limiting queries (builder + date)
CREATE INDEX idx_prototypes_builder_created ON public.prototypes (builder_id, created_at);

-- Create index for share lookups
CREATE INDEX idx_prototypes_share_id ON public.prototypes (share_id) WHERE share_id IS NOT NULL;
