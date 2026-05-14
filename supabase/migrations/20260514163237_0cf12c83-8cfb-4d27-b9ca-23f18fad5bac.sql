INSERT INTO public.studio_log (log_type, title, description, created_at) VALUES
  ('update', 'Land on Home after login', 'Builders now go straight to the Home chat after sign-in or finishing onboarding, instead of being bounced back to Profile.', now()),
  ('update', 'Past prototype prompts unlocked', 'The original prompt for every prototype you''ve built is now visible from your profile — not just new ones.', now() - interval '1 minute'),
  ('update', 'Copy Prompt button', 'Every Sidekick-delivered prompt now ships with a one-click copy action so it''s easier to take into Lovable.', now() - interval '2 minute'),
  ('update', 'Designer collaboration kickoff', 'Ryan Conlan joined Studio to refine the storytelling and visual craft across the site.', now() - interval '3 minute');