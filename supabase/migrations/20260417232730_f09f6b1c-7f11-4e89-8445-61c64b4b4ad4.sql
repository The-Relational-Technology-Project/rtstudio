CREATE TABLE public.contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contributor_name TEXT NOT NULL,
  contributor_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  links TEXT[] NOT NULL DEFAULT '{}',
  image_paths TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own contributions
CREATE POLICY "Users can insert own contributions"
ON public.contributions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own contributions
CREATE POLICY "Users can view own contributions"
ON public.contributions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- No public update or delete (stewards manage via service-role / DB)
CREATE INDEX idx_contributions_created_at ON public.contributions (created_at DESC);
CREATE INDEX idx_contributions_user_id ON public.contributions (user_id);