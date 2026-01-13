-- Magic Link Tokens table for invitations
CREATE TABLE IF NOT EXISTS public.magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  full_name TEXT,
  invited_by UUID REFERENCES auth.users(id),
  invited_by_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_magic_link_token ON public.magic_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_link_email ON public.magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_magic_link_expires ON public.magic_link_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.magic_link_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can manage all tokens
CREATE POLICY "Admins can manage magic link tokens"
  ON public.magic_link_tokens
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can read tokens by token value (for verification - no auth needed)
CREATE POLICY "Anyone can verify tokens"
  ON public.magic_link_tokens
  FOR SELECT
  TO anon
  USING (true);

-- User Preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remember_me BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'dark',
  email_notifications BOOLEAN DEFAULT TRUE,
  browser_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all preferences
CREATE POLICY "Admins can manage all preferences"
  ON public.user_preferences
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));