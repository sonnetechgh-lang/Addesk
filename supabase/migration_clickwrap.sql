-- Create consent_logs table for Influencers
CREATE TABLE IF NOT EXISTS public.consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    terms_version TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Influencers can read their own consent logs
CREATE POLICY "Users can view own consent logs"
    ON public.consent_logs FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert consent logs
CREATE POLICY "Users can insert own consent logs"
    ON public.consent_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- Create client_consent_logs table for Clients (unauthenticated)
CREATE TABLE IF NOT EXISTS public.client_consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_email TEXT NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    terms_version TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.client_consent_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a client consent log (since clients are unauthenticated)
CREATE POLICY "Anyone can insert client consent logs"
    ON public.client_consent_logs FOR INSERT
    WITH CHECK (true);

-- Influencers can read consent logs for their own profile
CREATE POLICY "Influencers can view client consent logs for their profile"
    ON public.client_consent_logs FOR SELECT
    USING (auth.uid() = influencer_id);
