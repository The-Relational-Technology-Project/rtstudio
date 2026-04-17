-- Lock down contact_submissions: explicit deny on read/update/delete (only admin/service-role accesses)
DROP POLICY IF EXISTS "No public read of contact submissions" ON public.contact_submissions;
CREATE POLICY "No public read of contact submissions"
ON public.contact_submissions
FOR SELECT
TO anon, authenticated
USING (false);

DROP POLICY IF EXISTS "No public update of contact submissions" ON public.contact_submissions;
CREATE POLICY "No public update of contact submissions"
ON public.contact_submissions
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No public delete of contact submissions" ON public.contact_submissions;
CREATE POLICY "No public delete of contact submissions"
ON public.contact_submissions
FOR DELETE
TO anon, authenticated
USING (false);

-- Tighten story_notes INSERT to authenticated users tying author to auth.uid()
DROP POLICY IF EXISTS "Anyone can add notes to stories" ON public.story_notes;
CREATE POLICY "Authenticated users can add notes to stories"
ON public.story_notes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
