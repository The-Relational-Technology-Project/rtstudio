CREATE TABLE public.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 50,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FAQs are viewable by everyone"
  ON public.faqs FOR SELECT
  USING (is_published = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert faqs"
  ON public.faqs FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update faqs"
  ON public.faqs FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete faqs"
  ON public.faqs FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.faqs (question, answer, sort_order) VALUES
('What is relational tech?', 'Technology that helps us connect with and care for each other. Small software built by people for a place. Tools we can reuse and remix across our neighborhoods.', 10),
('Do I need to know how to code?', 'No. You describe what your place needs in plain language, and the Studio''s building partner, Sidekick, helps you turn that into a working tool. You can also remix something a neighbor in another place already made. The skills that matter most here aren''t technical. They''re knowing your neighbors and paying attention to what your place is asking for.', 20),
('What can I build?', 'Whatever your block actually needs. The library is full of starting points: daily neighborhood digests, lending libraries, welcome guides, block-level hubs, directories of local groups and third spaces, walking guides layered with local history. Tools here are small and specific on purpose. One tool, one real need, the people right around you. We think in terms of 1:100, roughly one builder in relationship with a hundred neighbors. Fewer users, more co-creators.', 30),
('Is it really free? How is this sustained?', 'Yes, free to use. The Studio is stewarded by the Relational Tech Project, a nonprofit project supported by funders who believe neighborhoods should be able to build what they need. There are no ads, no data extraction, and no engagement algorithms. We are not trying to grow your screen time. We are trying to help you spend more time with the people around you.', 40),
('Who owns what I build, and what about my neighbors'' privacy?', 'You do. The tools and the software that powers the Studio are open-source, so you can take what you make, host it yourself, fork it, or hand it to someone else. Your neighbors'' information stays yours and theirs. We practice data minimalism: collect the least we need, never sell it, and never build surveillance into something meant to bring people together. We also have a roadmap toward community ownership of the tools and the infrastructure we build them on, so this stays a commons rather than a platform.', 50),
('Isn''t AI the opposite of human connection?', 'A lot of it is, and we take that seriously. Our stance is simple: we put AI to work for us, to handle what''s tedious about building, so you can spend your time with people instead of screens. Vision, relationship-building, and being present in your community stay fully human. AI never defines what your neighborhood needs or speaks for you. The Studio is built to send you back out to your block, not to keep you here.', 60);