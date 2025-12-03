-- Shop settings table to track current serving number
CREATE TABLE public.shop_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_serving INT NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily tokens table
CREATE TABLE public.daily_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_number INT NOT NULL,
  session_id TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_expired BOOLEAN NOT NULL DEFAULT false
);

-- Profiles table for shop owners
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  shop_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Shop settings policies (owner can manage their settings)
CREATE POLICY "Shop owners can view their settings" ON public.shop_settings
  FOR SELECT USING (auth.uid() = shop_owner_id);

CREATE POLICY "Shop owners can update their settings" ON public.shop_settings
  FOR UPDATE USING (auth.uid() = shop_owner_id);

CREATE POLICY "Shop owners can insert their settings" ON public.shop_settings
  FOR INSERT WITH CHECK (auth.uid() = shop_owner_id);

-- Public read access for current serving number
CREATE POLICY "Anyone can view shop settings" ON public.shop_settings
  FOR SELECT USING (true);

-- Daily tokens policies (public access for token generation)
CREATE POLICY "Anyone can view tokens" ON public.daily_tokens
  FOR SELECT USING (true);

CREATE POLICY "Anyone can generate tokens" ON public.daily_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update tokens" ON public.daily_tokens
  FOR UPDATE USING (true);

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (new.id);
  
  INSERT INTO public.shop_settings (shop_owner_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$;

-- Trigger to create profile and shop settings on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for shop_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_settings;