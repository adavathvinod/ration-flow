-- Add shop_code and is_open to shop_settings
ALTER TABLE public.shop_settings 
ADD COLUMN shop_code TEXT UNIQUE,
ADD COLUMN shop_name TEXT,
ADD COLUMN is_open BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster shop_code lookups
CREATE INDEX idx_shop_settings_shop_code ON public.shop_settings(shop_code);

-- Update daily_tokens to link to shop_settings
ALTER TABLE public.daily_tokens 
ADD COLUMN shop_id UUID REFERENCES public.shop_settings(id) ON DELETE CASCADE;

-- Create index for shop_id lookups
CREATE INDEX idx_daily_tokens_shop_id ON public.daily_tokens(shop_id);