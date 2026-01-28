-- Builder profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  neighborhood TEXT,
  neighborhood_description TEXT,
  dreams TEXT,
  tech_familiarity TEXT,
  ai_coding_experience TEXT,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vision board pins (private to user)
CREATE TABLE public.vision_board_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Commitments (formed in chat, tracked in profile)
CREATE TABLE public.commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  commitment_text TEXT NOT NULL,
  source_chat_context TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Serviceberries (engagement points)
CREATE TABLE public.serviceberries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_board_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serviceberries ENABLE ROW LEVEL SECURITY;

-- Profiles RLS: users can only read/update their own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Vision board pins: strictly private
CREATE POLICY "Users can view own pins" ON public.vision_board_pins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pins" ON public.vision_board_pins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pins" ON public.vision_board_pins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pins" ON public.vision_board_pins FOR DELETE USING (auth.uid() = user_id);

-- Commitments: user-only
CREATE POLICY "Users can view own commitments" ON public.commitments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own commitments" ON public.commitments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own commitments" ON public.commitments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own commitments" ON public.commitments FOR DELETE USING (auth.uid() = user_id);

-- Serviceberries: read own only (inserts via security definer function)
CREATE POLICY "Users can view own serviceberries" ON public.serviceberries FOR SELECT USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Serviceberries awarding function (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.award_serviceberries(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.serviceberries (user_id, amount, reason, reference_id)
  VALUES (p_user_id, p_amount, p_reason, p_reference_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update timestamp trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Vision board storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('vision-boards', 'vision-boards', false);

-- Storage RLS: Users can only manage their own images
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'vision-boards' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own images" ON storage.objects
  FOR SELECT USING (bucket_id = 'vision-boards' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'vision-boards' AND (storage.foldername(name))[1] = auth.uid()::text);