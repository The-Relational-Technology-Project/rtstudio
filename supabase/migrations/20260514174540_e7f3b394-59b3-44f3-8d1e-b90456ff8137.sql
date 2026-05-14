
-- Admins table
CREATE TABLE public.admins (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- No public access; admin status is checked via is_admin() function
CREATE POLICY "Admins can view admins list"
  ON public.admins FOR SELECT
  USING (user_id = auth.uid());

-- is_admin security definer function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = _user_id)
$$;

-- Seed admins
INSERT INTO public.admins (user_id) VALUES
  ('858462a3-7b4f-4ad3-a6ba-830963b0dc08'),
  ('353d87a0-f0dd-47f7-ad35-e3812f0e9d4c')
ON CONFLICT (user_id) DO NOTHING;

-- New columns
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.contributions ADD COLUMN IF NOT EXISTS promoted_item_id uuid;
ALTER TABLE public.contributions ADD COLUMN IF NOT EXISTS promoted_item_type text;

-- Admin override RLS policies
-- stories
CREATE POLICY "Admins can update any story" ON public.stories
  FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete any story" ON public.stories
  FOR DELETE USING (public.is_admin(auth.uid()));

-- prompts
CREATE POLICY "Admins can update any prompt" ON public.prompts
  FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete any prompt" ON public.prompts
  FOR DELETE USING (public.is_admin(auth.uid()));

-- tools
CREATE POLICY "Admins can update any tool" ON public.tools
  FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete any tool" ON public.tools
  FOR DELETE USING (public.is_admin(auth.uid()));

-- contributions
CREATE POLICY "Admins can view all contributions" ON public.contributions
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update contributions" ON public.contributions
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- studio_log: full CRUD for admins
CREATE POLICY "Admins can insert studio log" ON public.studio_log
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update studio log" ON public.studio_log
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete studio log" ON public.studio_log
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- profiles: admins can view all
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Builders overview function
CREATE OR REPLACE FUNCTION public.admin_builders_overview()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  neighborhood text,
  created_at timestamptz,
  commitments_count bigint,
  prototypes_count bigint,
  serviceberries_total bigint,
  last_active timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.email,
    p.display_name,
    p.neighborhood,
    p.created_at,
    (SELECT COUNT(*) FROM commitments c WHERE c.user_id = p.id),
    (SELECT COUNT(*) FROM prototypes pr WHERE pr.builder_id = p.id),
    COALESCE((SELECT SUM(amount) FROM serviceberries s WHERE s.user_id = p.id), 0),
    GREATEST(
      COALESCE((SELECT MAX(created_at) FROM commitments c WHERE c.user_id = p.id), 'epoch'::timestamptz),
      COALESCE((SELECT MAX(created_at) FROM prototypes pr WHERE pr.builder_id = p.id), 'epoch'::timestamptz),
      COALESCE((SELECT MAX(created_at) FROM chat_usage cu WHERE cu.user_id = p.id), 'epoch'::timestamptz),
      p.created_at
    )
  FROM profiles p
  WHERE public.is_admin(auth.uid())
  ORDER BY 9 DESC;
$$;
