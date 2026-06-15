CREATE POLICY "Admins can view all contribution uploads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'contribution-uploads' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can upload promoted story images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'story-images' AND public.is_admin(auth.uid()));