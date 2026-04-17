
-- Create private bucket for contribution uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('contribution-uploads', 'contribution-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can insert into their own folder
CREATE POLICY "Users can upload contribution images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contribution-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own contribution uploads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contribution-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Extend award_serviceberries to allow 'contribution_shared'
CREATE OR REPLACE FUNCTION public.award_serviceberries(p_user_id uuid, p_amount integer, p_reason text, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to award serviceberries';
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Cannot award serviceberries to other users';
  END IF;
  
  IF p_amount <= 0 OR p_amount > 100 THEN
    RAISE EXCEPTION 'Invalid serviceberry amount: must be between 1 and 100';
  END IF;
  
  IF p_reason NOT IN ('commitment_made', 'commitment_completed', 'profile_setup', 'story_shared', 'prompt_shared', 'tool_shared', 'contribution_shared') THEN
    RAISE EXCEPTION 'Invalid serviceberry reason';
  END IF;

  INSERT INTO public.serviceberries (user_id, amount, reason, reference_id)
  VALUES (p_user_id, p_amount, p_reason, p_reference_id);
END;
$function$;
