-- Update password to 'wecanrelate' with bcrypt hashing
UPDATE public.access_credentials 
SET password_hash = crypt('wecanrelate', gen_salt('bf'))
WHERE id = (SELECT id FROM public.access_credentials LIMIT 1);