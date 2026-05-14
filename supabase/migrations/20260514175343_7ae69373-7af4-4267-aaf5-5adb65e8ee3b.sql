CREATE POLICY "Admins can view embeddings"
  ON public.library_embeddings FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));